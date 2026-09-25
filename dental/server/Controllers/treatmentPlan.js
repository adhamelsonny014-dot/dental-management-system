const TreatmentPlan = require("../Models/TreatmentPlan");
const { findStaffForUser } = require("../utils/dentistScope");
const asyncHandler = require("../utils/asyncHandler");
const { FIELDS, pick } = require("../utils/fields");
const { paginate } = require("../utils/paginate");

const POPULATE = [
  { path: "patient", select: "firstName lastName patientNumber phone" },
  { path: "dentist", select: "firstName lastName" },
  { path: "createdBy", select: "name" },
];

// GET /api/treatment-plans?patient=&status=&page=1&limit=10
const getAll = asyncHandler(async (req, res) => {
  const { patient, status, page = 1, limit = 10 } = req.query;
  const query = {};
  if (patient) query.patient = patient;
  if (status) query.status = status;

  if (req.user.role === "dentist") {
    const staff = await findStaffForUser(req.user);
    if (staff) query.dentist = staff._id;
  }

  const { items, ...meta } = await paginate(TreatmentPlan, query, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: POPULATE,
  });
  return res.status(200).json({ plans: items, ...meta });
});

// GET /api/treatment-plans/:id
const getById = asyncHandler(async (req, res) => {
  const plan = await TreatmentPlan.findById(req.params.id).populate(POPULATE);
  if (!plan) return res.status(404).json({ message: "Treatment plan not found" });
  return res.status(200).json(plan);
});

// POST /api/treatment-plans
const create = asyncHandler(async (req, res) => {
  if (!req.body.patient) return res.status(400).json({ message: "Patient is required" });
  const plan = await TreatmentPlan.create({
    ...pick(req.body, FIELDS.treatmentPlan),
    createdBy: req.user._id,
  });
  await plan.populate(POPULATE);
  return res.status(201).json(plan);
});

// PUT /api/treatment-plans/:id
const update = asyncHandler(async (req, res) => {
  const plan = await TreatmentPlan.findByIdAndUpdate(req.params.id, pick(req.body, FIELDS.treatmentPlan), {
    new: true,
    runValidators: true,
  }).populate(POPULATE);
  if (!plan) return res.status(404).json({ message: "Treatment plan not found" });
  return res.status(200).json(plan);
});

// PATCH /api/treatment-plans/:id/status
const updateStatus = asyncHandler(async (req, res) => {
  const { status, approvedBy } = req.body;
  const updates = { status };
  if (status === "approved") {
    updates.approvedAt = new Date();
    if (approvedBy) updates.approvedBy = approvedBy;
  }
  const plan = await TreatmentPlan.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate(POPULATE);
  if (!plan) return res.status(404).json({ message: "Treatment plan not found" });
  return res.status(200).json(plan);
});

// PATCH /api/treatment-plans/:id/procedure/:procId  — update single procedure
const updateProcedure = asyncHandler(async (req, res) => {
  const plan = await TreatmentPlan.findById(req.params.id);
  if (!plan) return res.status(404).json({ message: "Plan not found" });

  const proc = plan.procedures.id(req.params.procId);
  if (!proc) return res.status(404).json({ message: "Procedure not found" });

  Object.assign(proc, pick(req.body, FIELDS.procedure));
  if (req.body.status === "completed") proc.completedAt = new Date();

  plan.markModified("procedures");
  await plan.save();
  await plan.populate(POPULATE);
  return res.status(200).json(plan);
});

// DELETE /api/treatment-plans/:id
const remove = asyncHandler(async (req, res) => {
  const plan = await TreatmentPlan.findByIdAndDelete(req.params.id);
  if (!plan) return res.status(404).json({ message: "Treatment plan not found" });
  return res.status(200).json({ message: "Deleted" });
});

// GET /api/treatment-plans/:id/report — full plan for printable report
const getReport = asyncHandler(async (req, res) => {
  const plan = await TreatmentPlan.findById(req.params.id)
    .populate("patient", "firstName lastName patientNumber phone email dateOfBirth")
    .populate("dentist", "firstName lastName specialization")
    .populate("createdBy", "name");
  if (!plan) return res.status(404).json({ message: "Treatment plan not found" });
  return res.status(200).json(plan);
});

module.exports = { getAll, getById, create, update, updateStatus, updateProcedure, remove, getReport };
