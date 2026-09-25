const Invoice = require("../Models/Invoice");
const Payment = require("../Models/Payment");
const TreatmentPlan = require("../Models/TreatmentPlan");
const asyncHandler = require("../utils/asyncHandler");
const { FIELDS, pick } = require("../utils/fields");
const { paginate } = require("../utils/paginate");

const POPULATE = [
  { path: "patient", select: "firstName lastName patientNumber phone email address city" },
  { path: "dentist", select: "firstName lastName specialization" },
  { path: "treatmentPlan", select: "title procedures" },
  { path: "createdBy", select: "name" },
];

// Helper: recalculate invoice status based on payments
const syncStatus = async (invoiceId) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice || ["cancelled", "draft"].includes(invoice.status)) return;

  const payments = await Payment.find({ invoice: invoiceId });
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const due = invoice.amountDue;

  let newStatus;
  if (paid >= due && invoice.grandTotal > 0)
    newStatus = "paid"; // includes fully insured invoices
  else if (paid > 0) newStatus = "partial";
  else newStatus = invoice.status === "overdue" ? "overdue" : "sent"; // unpaid: keep overdue flag

  if (newStatus !== invoice.status) {
    invoice.status = newStatus;
    await invoice.save();
  }
  return invoice;
};

// GET /api/invoices?patient=&status=&page=1&limit=15
const getAll = asyncHandler(async (req, res) => {
  const { patient, status, page = 1, limit = 15 } = req.query;
  const query = {};
  if (patient) query.patient = patient;
  if (status) query.status = status;

  const { items: invoices, ...meta } = await paginate(Invoice, query, {
    page,
    limit,
    sort: { issueDate: -1 },
    populate: POPULATE,
  });

  // Attach paid amounts
  const invoiceIds = invoices.map((i) => i._id);
  const payments = await Payment.aggregate([
    { $match: { invoice: { $in: invoiceIds } } },
    { $group: { _id: "$invoice", totalPaid: { $sum: "$amount" } } },
  ]);
  const paidMap = Object.fromEntries(payments.map((p) => [p._id.toString(), p.totalPaid]));

  const result = invoices.map((inv) => ({
    ...inv.toJSON(),
    totalPaid: paidMap[inv._id.toString()] || 0,
  }));

  return res.status(200).json({ invoices: result, ...meta });
});

// GET /api/invoices/:id  — includes payments
const getById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate(POPULATE);
  if (!invoice) return res.status(404).json({ message: "Invoice not found" });

  const payments = await Payment.find({ invoice: req.params.id })
    .populate("createdBy", "name")
    .sort({ paymentDate: -1 });
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  return res.status(200).json({ ...invoice.toJSON(), payments, totalPaid });
});

// POST /api/invoices
const create = asyncHandler(async (req, res) => {
  if (!req.body.patient) return res.status(400).json({ message: "Patient is required" });
  const invoice = await Invoice.create({ ...pick(req.body, FIELDS.invoice), createdBy: req.user._id });
  await invoice.populate(POPULATE);
  return res.status(201).json({ ...invoice.toJSON(), payments: [], totalPaid: 0 });
});

// POST /api/invoices/from-treatment-plan/:planId  — auto-populate line items
const createFromPlan = asyncHandler(async (req, res) => {
  const plan = await TreatmentPlan.findById(req.params.planId).populate("patient dentist");
  if (!plan) return res.status(404).json({ message: "Treatment plan not found" });

  const lineItems = plan.procedures
    .filter((p) => p.status !== "cancelled")
    .map((p) => ({
      description: p.name + (p.tooth ? ` (Tooth #${p.tooth})` : "") + (p.surface ? ` — ${p.surface}` : ""),
      tooth: p.tooth,
      quantity: p.quantity || 1,
      unitPrice: p.unitCost || 0,
    }));

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const invoice = await Invoice.create({
    patient: plan.patient._id,
    dentist: plan.dentist?._id,
    treatmentPlan: plan._id,
    lineItems,
    discount: plan.discount || 0,
    discountType: plan.discountType || "flat",
    dueDate,
    status: "sent",
    createdBy: req.user._id,
  });
  await invoice.populate(POPULATE);
  return res.status(201).json({ ...invoice.toJSON(), payments: [], totalPaid: 0 });
});

// PUT /api/invoices/:id
const update = asyncHandler(async (req, res) => {
  const updated = await Invoice.findByIdAndUpdate(req.params.id, pick(req.body, FIELDS.invoice), {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ message: "Invoice not found" });
  // Totals may have changed, so recalculate paid / partial / sent
  await syncStatus(updated._id);
  const invoice = await Invoice.findById(updated._id).populate(POPULATE);
  const payments = await Payment.find({ invoice: req.params.id }).sort({ paymentDate: -1 });
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  return res.status(200).json({ ...invoice.toJSON(), payments, totalPaid });
});

// PATCH /api/invoices/:id/status
const updateStatus = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true },
  ).populate(POPULATE);
  if (!invoice) return res.status(404).json({ message: "Invoice not found" });
  return res.status(200).json(invoice);
});

// DELETE /api/invoices/:id
const remove = asyncHandler(async (req, res) => {
  await Invoice.findByIdAndDelete(req.params.id);
  await Payment.deleteMany({ invoice: req.params.id });
  return res.status(200).json({ message: "Invoice and associated payments deleted" });
});

module.exports = { getAll, getById, create, createFromPlan, update, updateStatus, remove, syncStatus };
