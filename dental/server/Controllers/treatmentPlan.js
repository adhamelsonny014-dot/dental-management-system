const TreatmentPlan = require("../Models/TreatmentPlan");
const Staff = require("../Models/Staff");

const POPULATE = [
  { path: "patient", select: "firstName lastName patientNumber phone" },
  { path: "dentist",  select: "firstName lastName" },
  { path: "createdBy", select: "name" },
];

// GET /api/treatment-plans?patient=&status=&page=1&limit=10
const getAll = async (req, res) => {
  try {
    const { patient, status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (patient) query.patient = patient;
    if (status) query.status = status;

    if (req.user.role === "dentist") {
      const staff = await Staff.findOne({ $or: [{ userId: req.user._id }, { email: req.user.email }] });
      if (staff) query.dentist = staff._id;
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await TreatmentPlan.countDocuments(query);
    const plans = await TreatmentPlan.find(query)
      .populate(POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({ plans, total,
      page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/treatment-plans/:id
const getById = async (req, res) => {
  try {
    const plan = await TreatmentPlan.findById(req.params.id).populate(POPULATE);
    if (!plan) return res.status(404).json({ message: "Treatment plan not found" });
    return res.status(200).json(plan);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/treatment-plans
const create = async (req, res) => {
  try {
    if (!req.body.patient) return res.status(400).json({ message: "Patient is required" });
    const plan = await TreatmentPlan.create({ ...req.body, createdBy: req.user._id });
    await plan.populate(POPULATE);
    return res.status(201).json(plan);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /api/treatment-plans/:id
const update = async (req, res) => {
  try {
    const plan = await TreatmentPlan.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    ).populate(POPULATE);
    if (!plan) return res.status(404).json({ message: "Treatment plan not found" });
    return res.status(200).json(plan);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/treatment-plans/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status, approvedBy } = req.body;
    const updates = { status };
    if (status === "approved") {
      updates.approvedAt = new Date();
      if (approvedBy) updates.approvedBy = approvedBy;
    }
    const plan = await TreatmentPlan.findByIdAndUpdate(
      req.params.id, updates, { new: true }
    ).populate(POPULATE);
    if (!plan) return res.status(404).json({ message: "Treatment plan not found" });
    return res.status(200).json(plan);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/treatment-plans/:id/procedure/:procId  — update single procedure
const updateProcedure = async (req, res) => {
  try {
    const plan = await TreatmentPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const proc = plan.procedures.id(req.params.procId);
    if (!proc) return res.status(404).json({ message: "Procedure not found" });

    Object.assign(proc, req.body);
    if (req.body.status === "completed") proc.completedAt = new Date();

    plan.markModified("procedures");
    await plan.save();
    await plan.populate(POPULATE);
    return res.status(200).json(plan);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/treatment-plans/:id
const remove = async (req, res) => {
  try {
    const plan = await TreatmentPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: "Treatment plan not found" });
    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/treatment-plans/:id/report — full plan for printable report
const getReport = async (req, res) => {
  try {
    const plan = await TreatmentPlan.findById(req.params.id)
      .populate("patient", "firstName lastName patientNumber phone email dateOfBirth")
      .populate("dentist", "firstName lastName specialization")
      .populate("createdBy", "name");
    if (!plan) return res.status(404).json({ message: "Treatment plan not found" });
    return res.status(200).json(plan);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll, getById, create, update, updateStatus, updateProcedure, remove, getReport };
