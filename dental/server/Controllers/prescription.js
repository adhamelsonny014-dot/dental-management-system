const Prescription = require("../Models/Prescription");
const asyncHandler = require("../utils/asyncHandler");
const { FIELDS, pick } = require("../utils/fields");
const { paginate } = require("../utils/paginate");

const POPULATE = [
  { path: "patient", select: "firstName lastName patientNumber phone dateOfBirth" },
  { path: "dentist", select: "firstName lastName specialization" },
  { path: "createdBy", select: "name" },
  { path: "appointment", select: "startTime type" },
];

// GET /api/prescriptions?patient=&page=1&limit=10
const getAll = asyncHandler(async (req, res) => {
  const { patient, page = 1, limit = 10 } = req.query;
  const query = {};
  if (patient) query.patient = patient;

  const { items, ...meta } = await paginate(Prescription, query, {
    page,
    limit,
    sort: { issueDate: -1 },
    populate: POPULATE,
  });
  return res.status(200).json({ prescriptions: items, ...meta });
});

// GET /api/prescriptions/:id
const getById = asyncHandler(async (req, res) => {
  const rx = await Prescription.findById(req.params.id).populate(POPULATE);
  if (!rx) return res.status(404).json({ message: "Prescription not found" });
  return res.status(200).json(rx);
});

// POST /api/prescriptions
const create = asyncHandler(async (req, res) => {
  if (!req.body.patient) return res.status(400).json({ message: "Patient is required" });
  if (!req.body.medications?.length)
    return res.status(400).json({ message: "At least one medication is required" });

  const rx = await Prescription.create({ ...pick(req.body, FIELDS.prescription), createdBy: req.user._id });
  await rx.populate(POPULATE);
  return res.status(201).json(rx);
});

// PUT /api/prescriptions/:id
const update = asyncHandler(async (req, res) => {
  const rx = await Prescription.findByIdAndUpdate(req.params.id, pick(req.body, FIELDS.prescription), {
    new: true,
    runValidators: true,
  }).populate(POPULATE);
  if (!rx) return res.status(404).json({ message: "Prescription not found" });
  return res.status(200).json(rx);
});

// PATCH /api/prescriptions/:id/dispense
const dispense = asyncHandler(async (req, res) => {
  const rx = await Prescription.findByIdAndUpdate(
    req.params.id,
    { isDispensed: true, dispensedAt: new Date() },
    { new: true },
  ).populate(POPULATE);
  if (!rx) return res.status(404).json({ message: "Prescription not found" });
  return res.status(200).json(rx);
});

// DELETE /api/prescriptions/:id
const remove = asyncHandler(async (req, res) => {
  const rx = await Prescription.findByIdAndDelete(req.params.id);
  if (!rx) return res.status(404).json({ message: "Prescription not found" });
  return res.status(200).json({ message: "Deleted" });
});

module.exports = { getAll, getById, create, update, dispense, remove };
