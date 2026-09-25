const BookingRequest = require("../Models/BookingRequest");
const Staff = require("../Models/Staff");
const Patient = require("../Models/Patient");
const Appointment = require("../Models/Appointment");
const Clinic = require("../Models/Clinic");
const { parseTime, formatTime } = require("../utils/slots");
const { checkDentistAvailability } = require("../utils/appointmentValidation");
const { findStaffForUser } = require("../utils/dentistScope");
const { notifyUsers, notifyPatientByEmail } = require("../utils/notify");

const APPOINTMENT_TYPES = Appointment.schema.path("type").enumValues;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const POPULATE = [
  { path: "dentist", select: "firstName lastName specialization email color" },
  { path: "assignedDentist", select: "firstName lastName specialization email color" },
  { path: "appointment", select: "startTime endTime status type" },
  { path: "patient", select: "firstName lastName email phone" },
];

const { createPatientWithChart } = require("../utils/patientSetup");
const asyncHandler = require("../utils/asyncHandler");

const findOrCreatePatient = async ({ name, email, phone }) => {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] || "Guest";
  const lastName = parts.slice(1).join(" ") || "Patient";

  let patient = await Patient.findOne({ email: email.toLowerCase() });
  if (!patient) {
    const result = await createPatientWithChart({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone: phone || "",
    });
    patient = result.patient;
  }
  return patient;
};

const buildAppointmentTimes = (slotDate, slotStart, slotEnd, durationMins = 30) => {
  const start = new Date(slotDate);
  const [sh, sm] = slotStart.split(":").map(Number);
  start.setHours(sh, sm || 0, 0, 0);

  const end = new Date(slotDate);
  const [eh, em] = (slotEnd || slotStart).split(":").map(Number);
  end.setHours(eh, em || 0, 0, 0);
  if (end <= start) end.setTime(start.getTime() + durationMins * 60 * 1000);

  return { startTime: start, endTime: end };
};

// GET /api/booking-requests
const listBookingRequests = asyncHandler(async (req, res) => {
  const { status, flow } = req.query;
  const query = {};
  if (status) query.status = status;
  if (flow) query.flow = flow;

  if (req.user.role === "dentist") {
    const myStaff = await findStaffForUser(req.user);
    if (!myStaff) return res.status(200).json([]);
    query.$or = [{ dentist: myStaff._id }, { assignedDentist: myStaff._id }];
    query.status = { $in: ["sent_to_doctor", "doctor_approved", "doctor_rejected", "confirmed"] };
  }

  const items = await BookingRequest.find(query).populate(POPULATE).sort({ createdAt: -1 }).limit(100);

  return res.status(200).json(items);
});

// PATCH /api/booking-requests/:id/send-to-doctor
const sendToDoctor = asyncHandler(async (req, res) => {
  const br = await BookingRequest.findById(req.params.id);
  if (!br) return res.status(404).json({ message: "Booking request not found" });
  if (!["pending_admin", "reschedule_requested"].includes(br.status)) {
    return res.status(400).json({ message: "Cannot send to doctor in current status" });
  }

  const dentistId = br.flow === "direct" ? br.dentist : br.assignedDentist || br.dentist;
  if (!dentistId) {
    return res.status(400).json({ message: "Assign a dentist before sending to doctor" });
  }
  if (!br.slotDate || !br.slotStart) {
    return res.status(400).json({ message: "Set a date and time before sending to the doctor" });
  }

  br.status = "sent_to_doctor";
  br.adminNote = req.body?.note || br.adminNote;
  if (br.flow === "category" && req.body?.dentistId) {
    br.assignedDentist = req.body.dentistId;
  }
  await br.save();

  const staff = await Staff.findById(dentistId);
  // Notify only the specific doctor
  if (staff?.userId) {
    await notifyUsers({
      userIds: [staff.userId],
      subject: "New booking for your review",
      body: `${br.patientName} requested ${br.serviceCategory || "an appointment"} on ${br.slotDate ? new Date(br.slotDate).toLocaleDateString() : "TBD"} at ${br.slotStart || "TBD"}. Please confirm or request reschedule.`,
      type: "general",
    });
  }
  // Notify admin separately
  await notifyUsers({
    roleFilter: ["admin"],
    subject: "Booking sent to doctor",
    body: `Booking for ${br.patientName} has been sent to Dr. ${staff?.lastName || "assigned dentist"} for review.`,
    type: "general",
  });
  return res.status(200).json(await br.populate(POPULATE));
});

// PATCH /api/booking-requests/:id/assign
const assignDentist = asyncHandler(async (req, res) => {
  const { dentistId } = req.body;
  if (!dentistId) return res.status(400).json({ message: "dentistId is required" });

  const br = await BookingRequest.findById(req.params.id);
  if (!br) return res.status(404).json({ message: "Booking request not found" });
  if (br.flow !== "category") {
    return res.status(400).json({ message: "Assignment only applies to category bookings" });
  }

  br.assignedDentist = dentistId;
  br.dentist = dentistId;
  await br.save();

  await notifyUsers({
    roleFilter: ["admin", "receptionist"],
    subject: "Dentist assigned to booking",
    body: `${br.patientName}'s ${br.serviceCategory} request assigned. Forward to doctor when ready.`,
  });

  return res.status(200).json(await br.populate(POPULATE));
});

// PATCH /api/booking-requests/:id/schedule — set or change the date & time
// (needed for "any time" requests and for reschedules)
const scheduleRequest = asyncHandler(async (req, res) => {
  const { date, slotStart } = req.body;
  const day = new Date(date);
  if (!date || Number.isNaN(day.getTime()) || !TIME_RE.test(slotStart || "")) {
    return res.status(400).json({ message: "A valid date and time (HH:MM) are required" });
  }

  const br = await BookingRequest.findById(req.params.id);
  if (!br) return res.status(404).json({ message: "Booking request not found" });
  if (!["pending_admin", "reschedule_requested"].includes(br.status)) {
    return res.status(400).json({ message: "The time can only be changed before the doctor approves" });
  }

  const clinic = await Clinic.getSettings();
  const duration = clinic?.appointmentDuration || 30;
  const slotEnd = formatTime(parseTime(slotStart) + duration);

  const dentistId = br.dentist || br.assignedDentist;
  if (dentistId) {
    const { startTime, endTime } = buildAppointmentTimes(day, slotStart, slotEnd, duration);
    const check = await checkDentistAvailability(dentistId, startTime, endTime);
    if (!check.valid) return res.status(409).json({ message: check.message });
  }

  br.slotDate = day;
  br.slotStart = slotStart;
  br.slotEnd = slotEnd;
  await br.save();

  return res.status(200).json(await br.populate(POPULATE));
});

// PATCH /api/booking-requests/:id/doctor-response
const doctorResponse = asyncHandler(async (req, res) => {
  const { approved, note } = req.body;
  if (typeof approved !== "boolean") {
    return res.status(400).json({ message: "approved (boolean) is required" });
  }

  const br = await BookingRequest.findById(req.params.id);
  if (!br) return res.status(404).json({ message: "Booking request not found" });
  if (br.status !== "sent_to_doctor") {
    return res.status(400).json({ message: "Booking is not awaiting doctor response" });
  }
  if (req.user.role === "dentist") {
    const myStaff = await findStaffForUser(req.user);
    const assigned = [br.dentist, br.assignedDentist].filter(Boolean).map(String);
    if (!myStaff || !assigned.includes(String(myStaff._id))) {
      return res.status(403).json({ message: "This booking is assigned to another doctor" });
    }
  }

  br.status = approved ? "doctor_approved" : "reschedule_requested";
  br.doctorNote = note || "";
  await br.save();

  await notifyUsers({
    roleFilter: ["admin", "receptionist"],
    subject: approved ? "Doctor approved booking" : "Doctor requested reschedule",
    body: `Dr. review for ${br.patientName}: ${approved ? "approved" : "needs reschedule"}. ${note || ""}`,
    type: approved ? "appointment_confirmed" : "appointment_rescheduled",
  });

  return res.status(200).json(await br.populate(POPULATE));
});

// PATCH /api/booking-requests/:id/confirm-patient
const confirmPatient = asyncHandler(async (req, res) => {
  const br = await BookingRequest.findById(req.params.id);
  if (!br) return res.status(404).json({ message: "Booking request not found" });
  if (br.status !== "doctor_approved") {
    return res.status(400).json({ message: "Doctor must approve before confirming patient" });
  }

  const dentistId = br.dentist || br.assignedDentist;
  if (!dentistId || !br.slotDate || !br.slotStart) {
    return res.status(400).json({ message: "Set a dentist, date, and time before confirming" });
  }

  const clinic = await Clinic.getSettings();
  const duration = clinic?.appointmentDuration || 30;
  const { startTime, endTime } = buildAppointmentTimes(br.slotDate, br.slotStart, br.slotEnd, duration);

  // Don't double-book: the doctor must be working and free at that time
  const check = await checkDentistAvailability(dentistId, startTime, endTime);
  if (!check.valid) return res.status(409).json({ message: check.message });

  const patient = await findOrCreatePatient({
    name: br.patientName,
    email: br.patientEmail,
    phone: br.patientPhone,
  });

  const appt = await Appointment.create({
    patient: patient._id,
    dentist: dentistId,
    startTime,
    endTime,
    status: "confirmed",
    type: APPOINTMENT_TYPES.includes(br.serviceCategory) ? br.serviceCategory : "consultation",
    reason: br.message || `Website booking (${br.flow})`,
    createdBy: req.user._id,
  });

  br.status = "confirmed";
  br.patient = patient._id;
  br.appointment = appt._id;
  await br.save();

  const dentist = await Staff.findById(dentistId);
  const dateStr = startTime.toLocaleString();
  const body = `Dear ${br.patientName}, your appointment with Dr. ${dentist?.lastName || ""} is confirmed for ${dateStr}. Please arrive 10 minutes early.`;

  await notifyPatientByEmail({
    email: br.patientEmail,
    name: br.patientName,
    subject: "Your dental appointment is confirmed",
    body,
    type: "appointment_confirmed",
  });

  await notifyUsers({
    roleFilter: ["admin", "receptionist"],
    subject: "Booking confirmed for patient",
    body: `${br.patientName} confirmed for ${dateStr}.`,
    type: "appointment_confirmed",
  });

  return res.status(200).json(await br.populate(POPULATE));
});

// PATCH /api/booking-requests/:id/cancel
const cancelRequest = asyncHandler(async (req, res) => {
  const br = await BookingRequest.findById(req.params.id);
  if (!br) return res.status(404).json({ message: "Booking request not found" });
  if (br.status === "cancelled") {
    return res.status(400).json({ message: "Booking is already cancelled" });
  }

  const wasConfirmed = br.status === "confirmed";
  let apptTime = null;
  if (wasConfirmed && br.appointment) {
    // Free the doctor's calendar too
    const appt = await Appointment.findByIdAndUpdate(br.appointment, { status: "cancelled" }, { new: true });
    apptTime = appt?.startTime;
  }

  br.status = "cancelled";
  br.adminNote = req.body?.note || "";
  await br.save();

  await notifyPatientByEmail(
    wasConfirmed
      ? {
          email: br.patientEmail,
          name: br.patientName,
          subject: "Your dental appointment has been cancelled",
          body: `Dear ${br.patientName}, your appointment${apptTime ? ` on ${new Date(apptTime).toLocaleString()}` : ""} has been cancelled. Please visit our website to book a new time or call the clinic.`,
          type: "appointment_cancelled",
        }
      : {
          email: br.patientEmail,
          name: br.patientName,
          subject: "Appointment update — please reschedule",
          body: `Dear ${br.patientName}, we could not confirm your requested time. Please visit our website to pick a new slot or call the clinic.`,
          type: "appointment_rescheduled",
        },
  );

  return res.status(200).json(await br.populate(POPULATE));
});

module.exports = {
  listBookingRequests,
  sendToDoctor,
  assignDentist,
  scheduleRequest,
  doctorResponse,
  confirmPatient,
  cancelRequest,
};
