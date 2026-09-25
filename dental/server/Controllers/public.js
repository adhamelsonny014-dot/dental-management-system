const Clinic = require("../Models/Clinic");
const Staff = require("../Models/Staff");
const Patient = require("../Models/Patient");
const PublicInquiry = require("../Models/PublicInquiry");
const BookingRequest = require("../Models/BookingRequest");
const { getAvailableSlotsForDay } = require("../utils/slots");
const { createPatientWithChart } = require("../utils/patientSetup");
const { notifyUsers } = require("../utils/notify");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/public/clinic
const getPublicClinic = asyncHandler(async (req, res) => {
  const clinic = await Clinic.getSettings();
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
});

// GET /api/public/staff
const getPublicStaff = asyncHandler(async (req, res) => {
  // Public endpoint: never expose staff emails or phone numbers
  const staff = await Staff.find({ isActive: true })
    .select("firstName lastName role specialization color slug featured headline portfolioImages")
    .sort({ featured: -1, firstName: 1 });
  return res.status(200).json(staff);
});

// GET /api/public/featured-doctors
const getFeaturedDoctors = asyncHandler(async (req, res) => {
  const doctors = await Staff.find({ isActive: true, featured: true })
    .select("firstName lastName specialization slug color headline photo portfolioImages")
    .sort({ firstName: 1 });

  const base = "/site";
  const withPhotos = doctors.map((d) => ({
    id: d._id,
    slug: d.slug,
    name: `Dr. ${d.firstName} ${d.lastName}`,
    role: d.specialization,
    headline: d.headline,
    color: d.color,
    // Stored photo, or the naming convention used in client/public/site
    photo: d.photo || `${base}/doctor-${d.slug?.split("-")[0] || "default"}.jpg`,
    portfolio: d.portfolioImages?.length ? d.portfolioImages : [`${base}/${d.slug}-portfolio-1.jpg`],
  }));

  return res.status(200).json(withPhotos);
});

// GET /api/public/slots/:dentistId?date=YYYY-MM-DD
const getPublicSlots = asyncHandler(async (req, res) => {
  const { dentistId } = req.params;
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: "date query is required (YYYY-MM-DD)" });

  const staff = await Staff.findById(dentistId);
  if (!staff || !staff.isActive) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  const clinic = await Clinic.getSettings();
  const slots = await getAvailableSlotsForDay(staff, date, clinic.appointmentDuration || 30);

  return res.status(200).json({ date, slots });
});

// Website activity goes to the front desk
const notifyStaff = (subject, body, type = "general") =>
  notifyUsers({ roleFilter: ["admin", "receptionist"], subject, body, type });

// POST /api/public/contact
const submitContact = asyncHandler(async (req, res) => {
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
    `${inquiry.name} (${inquiry.email}): ${inquiry.message.slice(0, 200)}`,
  );

  return res.status(201).json({ message: "Thank you. We will get back to you soon." });
});

// POST /api/public/book/direct — featured doctor + calendar slot
const submitDirectBooking = asyncHandler(async (req, res) => {
  const { dentistId, name, email, phone, date, slotStart, slotEnd, message } = req.body;
  if (!dentistId || !name?.trim() || !email?.trim() || !phone?.trim() || !date || !slotStart) {
    return res.status(400).json({ message: "Doctor, contact details, date, and time slot are required" });
  }

  const staff = await Staff.findOne({ _id: dentistId, featured: true, isActive: true });
  if (!staff) return res.status(404).json({ message: "Featured doctor not found" });

  const clinic = await Clinic.getSettings();
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
    "general",
  );

  return res.status(201).json({
    message:
      "Booking submitted. Admin will forward to the doctor; you'll receive confirmation by email once approved.",
    bookingId: booking._id,
  });
});

// POST /api/public/book — category-based (checkup, whitening, cosmetic, etc.)
const submitBooking = asyncHandler(async (req, res) => {
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

  const dateStr = booking.slotDate ? booking.slotDate.toLocaleDateString() : "flexible";
  await notifyStaff(
    "Category booking request",
    `${booking.patientName} requested ${serviceType} on ${dateStr} at ${booking.slotStart || "TBD"}. Assign a dentist, then forward to doctor for confirmation.`,
    "general",
  );

  return res.status(201).json({
    message: "Request received. Admin will assign a dentist and you'll be notified by email once confirmed.",
    bookingId: booking._id,
  });
});

// POST /api/public/register-patient — creates patient + dental chart in admin portal
const registerPatient = asyncHandler(async (req, res) => {
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
    "general",
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
});

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
