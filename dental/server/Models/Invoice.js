const mongoose = require("mongoose");

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  tooth:       { type: Number, min: 1, max: 32 },
  quantity:    { type: Number, default: 1, min: 1 },
  unitPrice:   { type: Number, default: 0, min: 0 },
}, { _id: true });

lineItemSchema.virtual("total").get(function () {
  return this.quantity * this.unitPrice;
});

const invoiceSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    dentist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    treatmentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TreatmentPlan",
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    invoiceNumber: { type: String, unique: true },
    issueDate:     { type: Date, default: Date.now },
    dueDate:       { type: Date },
    status: {
      type: String,
      enum: ["draft", "sent", "partial", "paid", "overdue", "cancelled"],
      default: "draft",
    },
    lineItems:    { type: [lineItemSchema], default: [] },
    discount:     { type: Number, default: 0, min: 0 },
    discountType: { type: String, enum: ["flat", "percent"], default: "flat" },
    taxRate:      { type: Number, default: 0, min: 0, max: 100 }, // percentage
    notes:        { type: String, default: "" },
    // Insurance
    insuranceCoverage: { type: Number, default: 0, min: 0 },
    insuranceProvider: { type: String, default: "" },
  },
  { timestamps: true }
);

// Virtuals
invoiceSchema.virtual("subtotal").get(function () {
  return this.lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
});

invoiceSchema.virtual("discountAmount").get(function () {
  return this.discountType === "percent"
    ? (this.subtotal * this.discount) / 100
    : this.discount;
});

invoiceSchema.virtual("taxAmount").get(function () {
  return ((this.subtotal - this.discountAmount) * this.taxRate) / 100;
});

invoiceSchema.virtual("grandTotal").get(function () {
  return Math.max(0, this.subtotal - this.discountAmount + this.taxAmount);
});

invoiceSchema.virtual("amountDue").get(function () {
  return Math.max(0, this.grandTotal - this.insuranceCoverage);
});

invoiceSchema.set("toJSON",   { virtuals: true });
invoiceSchema.set("toObject", { virtuals: true });

// Auto-generate invoice number
invoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model("Invoice").countDocuments();
    const year  = new Date().getFullYear();
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

invoiceSchema.index({ patient: 1, issueDate: -1 });
invoiceSchema.index({ status: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
