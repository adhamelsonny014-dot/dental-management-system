const Patient = require("../Models/Patient");
const Appointment = require("../Models/Appointment");
const DentalChart = require("../Models/DentalChart");
const ClinicalNote = require("../Models/ClinicalNote");
const TreatmentPlan = require("../Models/TreatmentPlan");
const Prescription = require("../Models/Prescription");
const Invoice = require("../Models/Invoice");
const Payment = require("../Models/Payment");
const Notification = require("../Models/Notification");
const { createPatientWithChart } = require("../utils/patientSetup");
const { getDentistPatientIds, canAccessPatient } = require("../utils/dentistScope");
const asyncHandler = require("../utils/asyncHandler");
const { FIELDS, pick } = require("../utils/fields");
const { paginate } = require("../utils/paginate");

const FORBIDDEN = { message: "You can only access your own patients" };

// Escape regex metacharacters so a search term can't inject a pattern (ReDoS / logic)
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/patients?search=&page=1&limit=20&status=active
const getAllPatients = asyncHandler(async (req, res) => {
  const { search = "", page = 1, limit = 20, status } = req.query;
  const query = {};

  if (req.user?.role === "dentist") {
    const { patientIds } = await getDentistPatientIds(req.user);
    if (patientIds.length === 0) {
      return res.status(200).json({
        patients: [],
        total: 0,
        page: Number(page),
        totalPages: 0,
      });
    }
    query._id = { $in: patientIds };
  }

  if (String(search).trim()) {
    const term = escapeRegex(String(search).trim()).slice(0, 100);
    query.$or = [
      { firstName: { $regex: term, $options: "i" } },
      { lastName: { $regex: term, $options: "i" } },
      { phone: { $regex: term, $options: "i" } },
      { email: { $regex: term, $options: "i" } },
      { patientNumber: { $regex: term, $options: "i" } },
    ];
  }

  if (status) query.status = status;

  const { items, ...meta } = await paginate(Patient, query, {
    page,
    limit,
    sort: { createdAt: -1 },
    select: "firstName lastName phone email dateOfBirth gender status patientNumber createdAt",
  });
  return res.status(200).json({ patients: items, ...meta });
});

// GET /api/patients/:id
const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return res.status(404).json({ message: "Patient not found" });
  if (!(await canAccessPatient(req.user, patient._id))) return res.status(403).json(FORBIDDEN);
  return res.status(200).json(patient);
});

// POST /api/patients
const createPatient = asyncHandler(async (req, res) => {
  const { firstName, lastName } = req.body;
  if (!firstName || !lastName) {
    return res.status(400).json({ message: "First name and last name are required" });
  }
  const { patient, chart } = await createPatientWithChart({
    ...pick(req.body, FIELDS.patient),
    createdBy: req.user._id,
  });
  return res.status(201).json({ ...patient.toObject(), chartId: chart._id });
});

// PUT /api/patients/:id
const updatePatient = asyncHandler(async (req, res) => {
  if (!(await canAccessPatient(req.user, req.params.id))) return res.status(403).json(FORBIDDEN);
  const patient = await Patient.findByIdAndUpdate(req.params.id, pick(req.body, FIELDS.patient), {
    new: true,
    runValidators: true,
  });
  if (!patient) return res.status(404).json({ message: "Patient not found" });
  return res.status(200).json(patient);
});

// DELETE /api/patients/:id — also removes everything that belongs to the patient
const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndDelete(req.params.id);
  if (!patient) return res.status(404).json({ message: "Patient not found" });

  const byPatient = { patient: patient._id };
  await Promise.all([
    Appointment.deleteMany(byPatient),
    DentalChart.deleteMany(byPatient),
    ClinicalNote.deleteMany(byPatient),
    TreatmentPlan.deleteMany(byPatient),
    Prescription.deleteMany(byPatient),
    Invoice.deleteMany(byPatient),
    Payment.deleteMany(byPatient),
    Notification.deleteMany({ "recipient.patientId": patient._id }),
  ]);
  return res.status(200).json({ message: "Patient and all related records deleted" });
});

module.exports = { getAllPatients, getPatientById, createPatient, updatePatient, deletePatient };
