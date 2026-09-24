const Payment = require("../Models/Payment");
const { syncStatus } = require("./invoice");

const POPULATE = [
  { path: "patient", select: "firstName lastName patientNumber" },
  { path: "invoice", select: "invoiceNumber grandTotal amountDue status" },
  { path: "createdBy", select: "name" },
];

// GET /api/payments?patient=&invoice=&page=1&limit=20
const getAll = async (req, res) => {
  try {
    const { patient, invoice, page = 1, limit = 20 } = req.query;
    const query = {};
    if (patient) query.patient = patient;
    if (invoice) query.invoice = invoice;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate(POPULATE)
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({ payments, total,
      page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/payments  — record a new payment
const create = async (req, res) => {
  try {
    const { invoice, patient, amount, method } = req.body;
    if (!invoice || !patient || !amount || !method)
      return res.status(400).json({ message: "invoice, patient, amount, and method are required" });

    const payment = await Payment.create({ ...req.body, createdBy: req.user._id });
    // Recalculate invoice status
    await syncStatus(invoice);

    await payment.populate(POPULATE);
    return res.status(201).json(payment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/payments/:id
const remove = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    // Recalculate invoice status after removal
    await syncStatus(payment.invoice);
    return res.status(200).json({ message: "Payment deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll, create, remove };
