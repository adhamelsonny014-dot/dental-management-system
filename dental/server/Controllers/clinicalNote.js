const ClinicalNote = require("../Models/ClinicalNote");
const asyncHandler = require("../utils/asyncHandler");
const { FIELDS, pick } = require("../utils/fields");
const { paginate } = require("../utils/paginate");

const POPULATE = [
  { path: "dentist", select: "firstName lastName" },
  { path: "createdBy", select: "name" },
  { path: "appointment", select: "startTime type" },
];

// GET /api/clinical-notes?patient=&appointment=&page=1&limit=10
const getAll = asyncHandler(async (req, res) => {
  const { patient, appointment, page = 1, limit = 10 } = req.query;
  const query = {};
  if (patient) query.patient = patient;
  if (appointment) query.appointment = appointment;

  const { items, ...meta } = await paginate(ClinicalNote, query, {
    page,
    limit,
    sort: { visitDate: -1 },
    populate: POPULATE,
  });
  return res.status(200).json({ notes: items, ...meta });
});

// GET /api/clinical-notes/:id
const getById = asyncHandler(async (req, res) => {
  const note = await ClinicalNote.findById(req.params.id).populate(POPULATE);
  if (!note) return res.status(404).json({ message: "Note not found" });
  return res.status(200).json(note);
});

// POST /api/clinical-notes
const create = asyncHandler(async (req, res) => {
  if (!req.body.patient) return res.status(400).json({ message: "Patient is required" });
  const note = await ClinicalNote.create({ ...pick(req.body, FIELDS.clinicalNote), createdBy: req.user._id });
  await note.populate(POPULATE);
  return res.status(201).json(note);
});

// PUT /api/clinical-notes/:id
const update = asyncHandler(async (req, res) => {
  const note = await ClinicalNote.findByIdAndUpdate(req.params.id, pick(req.body, FIELDS.clinicalNote), {
    new: true,
    runValidators: true,
  }).populate(POPULATE);
  if (!note) return res.status(404).json({ message: "Note not found" });
  return res.status(200).json(note);
});

// DELETE /api/clinical-notes/:id
const remove = asyncHandler(async (req, res) => {
  const note = await ClinicalNote.findByIdAndDelete(req.params.id);
  if (!note) return res.status(404).json({ message: "Note not found" });
  return res.status(200).json({ message: "Deleted" });
});

module.exports = { getAll, getById, create, update, remove };
