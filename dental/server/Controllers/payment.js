const Payment = require("../Models/Payment");
const Invoice = require("../Models/Invoice");
const { syncStatus } = require("./invoice");
const asyncHandler = require("../utils/asyncHandler");
const { FIELDS, pick } = require("../utils/fields");
const { paginate } = require("../utils/paginate");

const POPULATE = [
  { path: "patient", select: "firstName lastName patientNumber" },
  // grandTotal and amountDue are virtuals, so load the fields they are calculated from
  {
    path: "invoice",
    select: "invoiceNumber status lineItems discount discountType taxRate insuranceCoverage",
  },
  { path: "createdBy", select: "name" },
];

// GET /api/payments?patient=&invoice=&page=1&limit=20
const getAll = asyncHandler(async (req, res) => {
  const { patient, invoice, page = 1, limit = 20 } = req.query;
  const query = {};
  if (patient) query.patient = patient;
  if (invoice) query.invoice = invoice;

  const { items, ...meta } = await paginate(Payment, query, {
    page,
    limit,
    sort: { paymentDate: -1 },
    populate: POPULATE,
  });
  return res.status(200).json({ payments: items, ...meta });
});

// POST /api/payments  — record a new payment
const create = asyncHandler(async (req, res) => {
  const { invoice: invoiceId, amount, method } = req.body;
  if (!invoiceId || !amount || !method)
    return res.status(400).json({ message: "invoice, amount, and method are required" });

  const invoice = await Invoice.findById(invoiceId).select("patient");
  if (!invoice) return res.status(404).json({ message: "Invoice not found" });

  // The patient always comes from the invoice, never from the request
  const payment = await Payment.create({
    ...pick(req.body, FIELDS.payment),
    patient: invoice.patient,
    createdBy: req.user._id,
  });
  // Recalculate invoice status
  await syncStatus(invoice._id);

  await payment.populate(POPULATE);
  return res.status(201).json(payment);
});

// DELETE /api/payments/:id
const remove = asyncHandler(async (req, res) => {
  const payment = await Payment.findByIdAndDelete(req.params.id);
  if (!payment) return res.status(404).json({ message: "Payment not found" });
  // Recalculate invoice status after removal
  await syncStatus(payment.invoice);
  return res.status(200).json({ message: "Payment deleted" });
});

module.exports = { getAll, create, remove };
