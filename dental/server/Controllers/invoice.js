const Invoice      = require("../Models/Invoice");
const Payment      = require("../Models/Payment");
const TreatmentPlan = require("../Models/TreatmentPlan");

const POPULATE = [
  { path: "patient",       select: "firstName lastName patientNumber phone email address city" },
  { path: "dentist",       select: "firstName lastName specialization" },
  { path: "treatmentPlan", select: "title procedures" },
  { path: "createdBy",     select: "name" },
];

// Helper: recalculate invoice status based on payments
const syncStatus = async (invoiceId) => {
  const invoice  = await Invoice.findById(invoiceId);
  if (!invoice || ["cancelled","draft"].includes(invoice.status)) return;

  const payments = await Payment.find({ invoice: invoiceId });
  const paid     = payments.reduce((s, p) => s + p.amount, 0);
  const due      = invoice.amountDue;

  let newStatus = invoice.status;
  if (paid <= 0)        newStatus = "sent";
  else if (paid < due)  newStatus = "partial";
  else                  newStatus = "paid";

  if (newStatus !== invoice.status) {
    invoice.status = newStatus;
    await invoice.save();
  }
  return invoice;
};

// GET /api/invoices?patient=&status=&page=1&limit=15
const getAll = async (req, res) => {
  try {
    const { patient, status, page = 1, limit = 15 } = req.query;
    const query = {};
    if (patient) query.patient = patient;
    if (status)  query.status  = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate(POPULATE)
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Attach paid amounts
    const invoiceIds = invoices.map((i) => i._id);
    const payments   = await Payment.aggregate([
      { $match: { invoice: { $in: invoiceIds } } },
      { $group: { _id: "$invoice", totalPaid: { $sum: "$amount" } } },
    ]);
    const paidMap = Object.fromEntries(payments.map((p) => [p._id.toString(), p.totalPaid]));

    const result = invoices.map((inv) => ({
      ...inv.toJSON(),
      totalPaid: paidMap[inv._id.toString()] || 0,
    }));

    return res.status(200).json({ invoices: result, total,
      page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/invoices/:id  — includes payments
const getById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(POPULATE);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const payments  = await Payment.find({ invoice: req.params.id })
      .populate("createdBy", "name").sort({ paymentDate: -1 });
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

    return res.status(200).json({ ...invoice.toJSON(), payments, totalPaid });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/invoices
const create = async (req, res) => {
  try {
    if (!req.body.patient) return res.status(400).json({ message: "Patient is required" });
    const invoice = await Invoice.create({ ...req.body, createdBy: req.user._id });
    await invoice.populate(POPULATE);
    return res.status(201).json({ ...invoice.toJSON(), payments: [], totalPaid: 0 });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/invoices/from-treatment-plan/:planId  — auto-populate line items
const createFromPlan = async (req, res) => {
  try {
    const plan = await TreatmentPlan.findById(req.params.planId)
      .populate("patient dentist");
    if (!plan) return res.status(404).json({ message: "Treatment plan not found" });

    const lineItems = plan.procedures
      .filter((p) => p.status !== "cancelled")
      .map((p) => ({
        description: p.name + (p.tooth ? ` (Tooth #${p.tooth})` : "") + (p.surface ? ` — ${p.surface}` : ""),
        tooth:       p.tooth,
        quantity:    p.quantity || 1,
        unitPrice:   p.unitCost || 0,
      }));

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await Invoice.create({
      patient:       plan.patient._id,
      dentist:       plan.dentist?._id,
      treatmentPlan: plan._id,
      lineItems,
      discount:      plan.discount || 0,
      discountType:  plan.discountType || "flat",
      dueDate,
      status:        "sent",
      createdBy:     req.user._id,
    });
    await invoice.populate(POPULATE);
    return res.status(201).json({ ...invoice.toJSON(), payments: [], totalPaid: 0 });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /api/invoices/:id
const update = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    ).populate(POPULATE);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    const payments  = await Payment.find({ invoice: req.params.id }).sort({ paymentDate: -1 });
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    return res.status(200).json({ ...invoice.toJSON(), payments, totalPaid });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/invoices/:id/status
const updateStatus = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    ).populate(POPULATE);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    return res.status(200).json(invoice);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/invoices/:id
const remove = async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    await Payment.deleteMany({ invoice: req.params.id });
    return res.status(200).json({ message: "Invoice and associated payments deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll, getById, create, createFromPlan, update, updateStatus, remove, syncStatus };
