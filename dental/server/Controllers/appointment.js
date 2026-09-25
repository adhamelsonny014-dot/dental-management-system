const Appointment = require("../Models/Appointment");
const { hasConflict } = require("../utils/appointmentValidation");
const asyncHandler = require("../utils/asyncHandler");
const { FIELDS, pick } = require("../utils/fields");

const POPULATE = [
  { path: "patient", select: "firstName lastName phone patientNumber" },
  { path: "dentist", select: "firstName lastName color role" },
];

// GET /api/appointments?dentist=&patient=&start=&end=&status=&today=true
const getAllAppointments = asyncHandler(async (req, res) => {
  const { dentist, patient, start, end, status, today } = req.query;
  const query = {};

  if (dentist) query.dentist = dentist;
  if (patient) query.patient = patient;
  if (status) query.status = status;

  if (today === "true") {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    query.startTime = { $gte: dayStart, $lt: dayEnd };
  } else if (start || end) {
    query.startTime = {};
    if (start) query.startTime.$gte = new Date(start);
    if (end) query.startTime.$lte = new Date(end);
  }

  const appointments = await Appointment.find(query).populate(POPULATE).sort({ startTime: 1 });

  return res.status(200).json(appointments);
});

// GET /api/appointments/:id
const getAppointmentById = asyncHandler(async (req, res) => {
  const appt = await Appointment.findById(req.params.id).populate(POPULATE);
  if (!appt) return res.status(404).json({ message: "Appointment not found" });
  return res.status(200).json(appt);
});

// POST /api/appointments
const createAppointment = asyncHandler(async (req, res) => {
  const { patient, dentist, startTime, endTime } = req.body;
  if (!patient || !dentist || !startTime || !endTime)
    return res.status(400).json({ message: "patient, dentist, startTime, and endTime are required" });

  const check = await hasConflict(dentist, startTime, endTime);
  if (!check.valid) return res.status(409).json({ message: check.message });

  const appt = await Appointment.create({ ...pick(req.body, FIELDS.appointment), createdBy: req.user._id });
  await appt.populate(POPULATE);
  return res.status(201).json(appt);
});

// PUT /api/appointments/:id
const updateAppointment = asyncHandler(async (req, res) => {
  const existing = await Appointment.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: "Appointment not found" });

  const dentist = req.body.dentist || existing.dentist;
  const startTime = req.body.startTime || existing.startTime;
  const endTime = req.body.endTime || existing.endTime;
  const check = await hasConflict(dentist, startTime, endTime, req.params.id);
  if (!check.valid) return res.status(409).json({ message: check.message });

  const appt = await Appointment.findByIdAndUpdate(req.params.id, pick(req.body, FIELDS.appointment), {
    new: true,
    runValidators: true,
  }).populate(POPULATE);
  if (!appt) return res.status(404).json({ message: "Appointment not found" });
  return res.status(200).json(appt);
});

// PATCH /api/appointments/:id/status
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const appt = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true },
  ).populate(POPULATE);
  if (!appt) return res.status(404).json({ message: "Appointment not found" });
  return res.status(200).json(appt);
});

// DELETE /api/appointments/:id
const deleteAppointment = asyncHandler(async (req, res) => {
  const appt = await Appointment.findByIdAndDelete(req.params.id);
  if (!appt) return res.status(404).json({ message: "Appointment not found" });
  return res.status(200).json({ message: "Appointment deleted" });
});

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateStatus,
  deleteAppointment,
};
