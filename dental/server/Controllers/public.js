const Clinic = require("../Models/Clinic");
const Staff = require("../Models/Staff");
const Patient = require("../Models/Patient");
const PublicInquiry = require("../Models/PublicInquiry");
const BookingRequest = require("../Models/BookingRequest");
const Notification = require("../Models/Notification");
const User = require("../Models/User");
const { getAvailableSlotsForDay } = require("../utils/slots");
const { createPatientWithChart } = require("../utils/patientSetup");

const getOrCreateClinic = async () => {
  let clinic = await Clinic.findOne();
  if (!clinic) clinic = await Clinic.create({});
  return clinic;
};

// GET /api/public/clinic
const getPublicClinic = async (req, res) => {
  try {
    const clinic = await getOrCreateClinic();
    return res.status(200).json({
      name: clinic.name,
      phone: clinic.phone,
      email: clinic.email,
      address: clinic.address,
      city: clinic.city,
      country: clinic.country,
      workingHours: clinic.workingHours,
      appointmentDuration: clinic.appointmentDuration,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/public/staff
const getPublicStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ isActive: true })
      .select("firstName lastName role specialization email phone color slug featured headline portfolioImages")
      .sort({ featured: -1, firstName: 1 });
    return res.status(200).json(staff);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/public/featured-doctors
const getFeaturedDoctors = async (req, res) => {
  try {
    const doctors = await Staff.find({ isActive: true, featured: true })
      .select("firstName lastName specialization slug color headline portfolioImages")
      .sort({ firstName: 1 });

    const base = "/site";
    const withPhotos = doctors.map((d) => ({
      id: d._id,
      slug: d.slug,
      name: `Dr. ${d.firstName} ${d.lastName}`,
      role: d.specialization,
      headline: d.headline,
      color: d.color,
      photo:
        d.slug === "tala-el-serysy"
          ? `${base}/doctor-tala.jpg`
          : d.slug === "omar-el-antary"
            ? `${base}/doctor-omar.jpg`
            : `${base}/doctor-${d.slug?.split("-")[0] || "default"}.jpg`,
      portfolio: d.portfolioImages?.length
        ? d.portfolioImages
        : [`${base}/${d.slug}-portfolio-1.jpg`],
    }));

    return res.status(200).json(withPhotos);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/public/slots/:dentistId?date=YYYY-MM-DD
const getPublicSlots = async (req, res) => {
  try {
    const { dentistId } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "date query is required (YYYY-MM-DD)" });

    const staff = await Staff.findById(dentistId);
    if (!staff || !staff.isActive) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const clinic = await getOrCreateClinic();
    const slots = await getAvailableSlotsForDay(
      staff,
      date,
      clinic.appointmentDuration || 30
    );

    return res.status(200).json({ date, slots });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const notifyStaff = async (subject, body, type = "general") => {
  const admins = await User.find({
    role: { $in: ["admin", "receptionist"] },
    isActive: true,
  }).select("_id name");

  if (!admins.length) return;

  await Notification.insertMany(
    admins.map((u) => ({
      type,
      channel: "in-app",
      recipient: { userId: u._id, name: u.name },
      subject,
      body,
      status: "sent",
      sentAt: new Date(),
    }))
  );
};

// POST /api/public/contact
const submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ message: "Name, email, and message are required" });
    }

    const inquiry = await PublicInquiry.create({
      type: "contact",
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || "",
      subject: subject?.trim() || "Website inquiry",
      message: message.trim(),
    });

    await notifyStaff(
      "New website message",
      `${inquiry.name} (${inquiry.email}): ${inquiry.message.slice(0, 200)}`
    );

    return res.status(201).json({ message: "Thank you. We will get back to you soon." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/public/book/direct — featured doctor + calendar slot
const submitDirectBooking = async (req, res) => {
  try {
    const { dentistId, name, email, phone, date, slotStart, slotEnd, message } = req.body;
    if (!dentistId || !name?.trim() || !email?.trim() || !phone?.trim() || !date || !slotStart) {
      return res.status(400).json({ message: "Doctor, contact details, date, and time slot are required" });
    }

    const staff = await Staff.findOne({ _id: dentistId, featured: true, isActive: true });
    if (!staff) return res.status(404).json({ message: "Featured doctor not found" });

    const clinic = await getOrCreateClinic();
    const available = await getAvailableSlotsForDay(staff, date, clinic.appointmentDuration || 30);
    const ok = available.some((s) => s.start === slotStart);
    if (!ok) return res.status(409).json({ message: "This slot is no longer available" });

    const end = slotEnd || available.find((s) => s.start === slotStart)?.end || slotStart;

    const booking = await BookingRequest.create({
      flow: "direct",
      status: "pending_admin",
      patientName: name.trim(),
      patientEmail: email.trim(),
      patientPhone: phone.trim(),
      message: message?.trim() || "",
      dentist: staff._id,
      slotDate: new Date(date),
      slotStart,
      slotEnd: end,
      serviceCategory: "consultation",
    });

    await notifyStaff(
      "Direct doctor booking — action needed",
      `${booking.patientName} booked Dr. ${staff.lastName} on ${new Date(date).toLocaleDateString()} at ${slotStart}. Review and forward to the doctor.`,
      "general"
    );

    return res.status(201).json({
      message: "Booking submitted. Admin will forward to the doctor; you'll receive confirmation by email once approved.",
      bookingId: booking._id,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/public/book — category-based (checkup, whitening, cosmetic, etc.)
const submitBooking = async (req, res) => {
  try {
    const { name, email, phone, preferredDate, preferredTime, serviceType, message } = req.body;
    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return res.status(400).json({ message: "Name, email, and phone are required" });
    }
    if (!serviceType) {
      return res.status(400).json({ message: "Please select a service category" });
    }

    await PublicInquiry.create({
      type: "booking",
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      preferredDate: preferredDate ? new Date(preferredDate) : undefined,
      preferredTime: preferredTime?.trim() || "",
      serviceType: serviceType || "",
      message: message?.trim() || "",
    });

    const booking = await BookingRequest.create({
      flow: "category",
      status: "pending_admin",
      patientName: name.trim(),
      patientEmail: email.trim(),
      patientPhone: phone.trim(),
      message: message?.trim() || "",
      serviceCategory: serviceType,
      slotDate: preferredDate ? new Date(preferredDate) : undefined,
      slotStart: preferredTime?.trim() || "",
    });

    const dateStr = booking.slotDate
      ? booking.slotDate.toLocaleDateString()
      : "flexible";
    await notifyStaff(
      "Category booking request",
      `${booking.patientName} requested ${serviceType} on ${dateStr} at ${booking.slotStart || "TBD"}. Assign a dentist, then forward to doctor for confirmation.`,
      "general"
    );

    return res.status(201).json({
      message: "Request received. Admin will assign a dentist and you'll be notified by email once confirmed.",
      bookingId: booking._id,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/public/register-patient — creates patient + dental chart in admin portal
const registerPatient = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, gender, message } = req.body;
    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ message: "First name and last name are required" });
    }
    if (!email?.trim() && !phone?.trim()) {
      return res.status(400).json({ message: "Email or phone is required" });
    }

    if (email?.trim()) {
      const exists = await Patient.findOne({ email: email.trim().toLowerCase() });
      if (exists) {
        return res.status(400).json({ message: "A patient with this email is already registered" });
      }
    }

    const { patient, chart } = await createPatientWithChart({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email?.trim() || "",
      phone: phone?.trim() || "",
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || "",
      notes: message?.trim() || "Registered via website",
      status: "active",
    });

    await notifyStaff(
      "New patient registered",
      `${patient.firstName} ${patient.lastName} (${patient.patientNumber}) registered online. Dental chart created.`,
      "general"
    );

    return res.status(201).json({
      message: "Registration successful. Your record and dental chart are now in our system.",
      patient: {
        id: patient._id,
        patientNumber: patient.patientNumber,
        name: `${patient.firstName} ${patient.lastName}`,
      },
      chartId: chart._id,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPublicClinic,
  getPublicStaff,
  getFeaturedDoctors,
  getPublicSlots,
  submitContact,
  submitBooking,
  submitDirectBooking,
  registerPatient,
};
