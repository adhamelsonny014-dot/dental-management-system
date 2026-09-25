const mongoose = require("mongoose");
const { nextSequence } = require("../utils/sequence");

const paymentSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    amount: { type: Number, required: true, min: 0.01 },
    method: {
      type: String,
      enum: ["cash", "card", "bank-transfer", "insurance", "cheque", "other"],
      required: true,
    },
    paymentDate: { type: Date, default: Date.now },
    reference: { type: String, default: "" }, // card last 4, cheque no, etc.
    notes: { type: String, default: "" },
    receiptNumber: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

// Auto-generate receipt number
paymentSchema.pre("save", async function (next) {
  if (!this.receiptNumber) {
    const seq = await nextSequence("payment", mongoose.model("Payment"), "receiptNumber");
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    this.receiptNumber = `RCP-${dateStr}-${String(seq).padStart(4, "0")}`;
  }
  next();
});

paymentSchema.index({ invoice: 1 });
paymentSchema.index({ patient: 1, paymentDate: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
