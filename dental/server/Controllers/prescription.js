const Prescription = require("../Models/Prescription");

const POPULATE = [
  { path: "patient",     select: "firstName lastName patientNumber phone dateOfBirth" },
  { path: "dentist",     select: "firstName lastName specialization" },
  { path: "createdBy",   select: "name" },
  { path: "appointment", select: "startTime type" },
];

// GET /api/prescriptions?patient=&page=1&limit=10
const getAll = async (req, res) => {
  try {
    const { patient, page = 1, limit = 10 } = req.query;
    const query = {};
    if (patient) query.patient = patient;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Prescription.countDocuments(query);
    const prescriptions = await Prescription.find(query)
      .populate(POPULATE)
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({ prescriptions, total,
      page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/prescriptions/:id
const getById = async (req, res) => {
  try {
    const rx = await Prescription.findById(req.params.id).populate(POPULATE);
    if (!rx) return res.status(404).json({ message: "Prescription not found" });
    return res.status(200).json(rx);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/prescriptions
const create = async (req, res) => {
  try {
    if (!req.body.patient) return res.status(400).json({ message: "Patient is required" });
    if (!req.body.medications?.length)
      return res.status(400).json({ message: "At least one medication is required" });

    const rx = await Prescription.create({ ...req.body, createdBy: req.user._id });
    await rx.populate(POPULATE);
    return res.status(201).json(rx);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /api/prescriptions/:id
const update = async (req, res) => {
  try {
    const rx = await Prescription.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    ).populate(POPULATE);
    if (!rx) return res.status(404).json({ message: "Prescription not found" });
    return res.status(200).json(rx);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/prescriptions/:id/dispense
const dispense = async (req, res) => {
  try {
    const rx = await Prescription.findByIdAndUpdate(
      req.params.id,
      { isDispensed: true, dispensedAt: new Date() },
      { new: true }
    ).populate(POPULATE);
    if (!rx) return res.status(404).json({ message: "Prescription not found" });
    return res.status(200).json(rx);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/prescriptions/:id
const remove = async (req, res) => {
  try {
    const rx = await Prescription.findByIdAndDelete(req.params.id);
    if (!rx) return res.status(404).json({ message: "Prescription not found" });
    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll, getById, create, update, dispense, remove };
