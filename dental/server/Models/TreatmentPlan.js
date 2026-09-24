const mongoose = require("mongoose");

const procedureItemSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  tooth:       { type: Number, min: 1, max: 32 }, // optional tooth number
  surface:     { type: String, default: "" },
  quantity:    { type: Number, default: 1, min: 1 },
  unitCost:    { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ["pending", "approved", "in-progress", "completed", "cancelled"],
    default: "pending",
  },
  notes:       { type: String, default: "" },
  completedAt: { type: Date },
}, { _id: true });

// virtual: line total
procedureItemSchema.virtual("total").get(function () {
  return this.quantity * this.unitCost;
});

const treatmentPlanSchema = new mongoose.Schema(
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title:       { type: String, default: "Treatment Plan" },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "proposed", "approved", "in-progress", "completed", "cancelled"],
      default: "draft",
    },
    procedures:    { type: [procedureItemSchema], default: [] },
    approvedAt:    { type: Date },
    approvedBy:    { type: String, default: "" }, // patient signature / name
    notes:         { type: String, default: "" },
    discount:      { type: Number, default: 0, min: 0 },   // flat discount
    discountType:  { type: String, enum: ["flat","percent"], default: "flat" },
  },
  { timestamps: true }
);

// Virtual: subtotal
treatmentPlanSchema.virtual("subtotal").get(function () {
  return this.procedures.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
});

// Virtual: total after discount
treatmentPlanSchema.virtual("grandTotal").get(function () {
  const sub = this.subtotal;
  if (this.discountType === "percent") return sub - (sub * this.discount) / 100;
  return sub - this.discount;
});

treatmentPlanSchema.set("toJSON",   { virtuals: true });
treatmentPlanSchema.set("toObject", { virtuals: true });
treatmentPlanSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model("TreatmentPlan", treatmentPlanSchema);
