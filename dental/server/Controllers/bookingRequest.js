const BookingRequest = require("../Models/BookingRequest");
const Staff = require("../Models/Staff");
const Patient = require("../Models/Patient");
const Appointment = require("../Models/Appointment");
const Clinic = require("../Models/Clinic");
const { getAvailableSlotsForDay } = require("../utils/slots");
const { notifyUsers, notifyPatientByEmail } = require("../utils/notify");

const POPULATE = [
  { path: "dentist", select: "firstName lastName specialization email color" },
  { path: "assignedDentist", select: "firstName lastName specialization email color" },
  { path: "appointment", select: "startTime endTime status type" },
  { path: "patient", select: "firstName lastName email phone" },
];

const { createPatientWithChart } = require("../utils/patientSetup");

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

const buildAppointmentTimes = (slotDate, slotStart, slotEnd) => {
  const start = new Date(slotDate);
  const [sh, sm] = slotStart.split(":").map(Number);
  start.setHours(sh, sm || 0, 0, 0);

  const end = new Date(slotDate);
  const [eh, em] = (slotEnd || slotStart).split(":").map(Number);
  end.setHours(eh, em || 0, 0, 0);
  if (end <= start) end.setMinutes(end.getMinutes() + 30);

  return { startTime: start, endTime: end };
};

// GET /api/booking-requests
const listBookingRequests = async (req, res) => {
  try {
    const { status, flow } = req.query;
    const query = {};
    if (status) query.status = status;
    if (flow) query.flow = flow;

    if (req.user.role === "dentist") {
    const myStaff = await Staff.findOne({ 
  $or: [{ userId: req.user._id }, { email: req.user.email }] 
});
      if (!myStaff) return res.status(200).json([]);
      query.$or = [{ dentist: myStaff._id }, { assignedDentist: myStaff._id }];
      query.status = { $in: ["sent_to_doctor", "doctor_approved", "doctor_rejected", "confirmed"] };
    }

    const items = await BookingRequest.find(query)
      .populate(POPULATE)
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/booking-requests/:id/send-to-doctor
const sendToDoctor = async (req, res) => {
  try {
    const br = await BookingRequest.findById(req.params.id);
    if (!br) return res.status(404).json({ message: "Booking request not found" });
    if (!["pending_admin", "reschedule_requested"].includes(br.status)) {
      return res.status(400).json({ message: "Cannot send to doctor in current status" });
    }

    const dentistId = br.flow === "direct" ? br.dentist : br.assignedDentist || br.dentist;
    if (!dentistId) {
      return res.status(400).json({ message: "Assign a dentist before sending to doctor" });
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
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/booking-requests/:id/assign
const assignDentist = async (req, res) => {
  try {
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
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/booking-requests/:id/doctor-response
const doctorResponse = async (req, res) => {
  try {
    const { approved, note } = req.body;
    if (typeof approved !== "boolean") {
      return res.status(400).json({ message: "approved (boolean) is required" });
    }

    const br = await BookingRequest.findById(req.params.id);
    if (!br) return res.status(404).json({ message: "Booking request not found" });
    if (br.status !== "sent_to_doctor") {
      return res.status(400).json({ message: "Booking is not awaiting doctor response" });
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
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/booking-requests/:id/confirm-patient
const confirmPatient = async (req, res) => {
  try {
    const br = await BookingRequest.findById(req.params.id);
    if (!br) return res.status(404).json({ message: "Booking request not found" });
    if (br.status !== "doctor_approved") {
      return res.status(400).json({ message: "Doctor must approve before confirming patient" });
    }

    const dentistId = br.dentist || br.assignedDentist;
    if (!dentistId || !br.slotDate || !br.slotStart) {
      return res.status(400).json({ message: "Missing dentist or slot information" });
    }

    const patient = await findOrCreatePatient({
      name: br.patientName,
      email: br.patientEmail,
      phone: br.patientPhone,
    });

    const { startTime, endTime } = buildAppointmentTimes(br.slotDate, br.slotStart, br.slotEnd);
    const clinic = await Clinic.findOne();
    const duration = clinic?.appointmentDuration || 30;

    const appt = await Appointment.create({
      patient: patient._id,
      dentist: dentistId,
      startTime,
      endTime,
      status: "confirmed",
      type: br.serviceCategory || "consultation",
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
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/booking-requests/:id/cancel
const cancelRequest = async (req, res) => {
  try {
    const br = await BookingRequest.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled", adminNote: req.body?.note || "" },
      { new: true }
    ).populate(POPULATE);
    if (!br) return res.status(404).json({ message: "Booking request not found" });

    await notifyPatientByEmail({
      email: br.patientEmail,
      name: br.patientName,
      subject: "Appointment update — please reschedule",
      body: `Dear ${br.patientName}, we could not confirm your requested time. Please visit our website to pick a new slot or call the clinic.`,
      type: "appointment_rescheduled",
    });

    return res.status(200).json(br);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listBookingRequests,
  sendToDoctor,
  assignDentist,
  doctorResponse,
  confirmPatient,
  cancelRequest,
};
