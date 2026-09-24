const ClinicalNote = require("../Models/ClinicalNote");

const POPULATE = [
  { path: "dentist",      select: "firstName lastName" },
  { path: "createdBy",    select: "name" },
  { path: "appointment",  select: "startTime type" },
];

// GET /api/clinical-notes?patient=&appointment=&page=1&limit=10
const getAll = async (req, res) => {
  try {
    const { patient, appointment, page = 1, limit = 10 } = req.query;
    const query = {};
    if (patient)     query.patient     = patient;
    if (appointment) query.appointment = appointment;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await ClinicalNote.countDocuments(query);
    const notes = await ClinicalNote.find(query)
      .populate(POPULATE)
      .sort({ visitDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({ notes, total,
      page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/clinical-notes/:id
const getById = async (req, res) => {
  try {
    const note = await ClinicalNote.findById(req.params.id).populate(POPULATE);
    if (!note) return res.status(404).json({ message: "Note not found" });
    return res.status(200).json(note);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/clinical-notes
const create = async (req, res) => {
  try {
    if (!req.body.patient) return res.status(400).json({ message: "Patient is required" });
    const note = await ClinicalNote.create({ ...req.body, createdBy: req.user._id });
    await note.populate(POPULATE);
    return res.status(201).json(note);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /api/clinical-notes/:id
const update = async (req, res) => {
  try {
    const note = await ClinicalNote.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    ).populate(POPULATE);
    if (!note) return res.status(404).json({ message: "Note not found" });
    return res.status(200).json(note);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/clinical-notes/:id
const remove = async (req, res) => {
  try {
    const note = await ClinicalNote.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
