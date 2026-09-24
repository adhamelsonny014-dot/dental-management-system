const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  dosage:      { type: String, default: "" },   // e.g. "500mg"
  frequency:   { type: String, default: "" },   // e.g. "3x daily"
  duration:    { type: String, default: "" },   // e.g. "5 days"
  instructions:{ type: String, default: "" },   // e.g. "Take after meals"
  quantity:    { type: String, default: "" },   // e.g. "15 tablets"
}, { _id: true });

const prescriptionSchema = new mongoose.Schema(
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
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    prescriptionNumber: { type: String, unique: true },
    issueDate:    { type: Date, default: Date.now },
    medications:  { type: [medicationSchema], default: [] },
    diagnosis:    { type: String, default: "" },
    notes:        { type: String, default: "" },
    isDispensed:  { type: Boolean, default: false },
    dispensedAt:  { type: Date },
  },
  { timestamps: true }
);

// Auto-generate prescription number
prescriptionSchema.pre("save", async function (next) {
  if (!this.prescriptionNumber) {
    const count = await mongoose.model("Prescription").countDocuments();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    this.prescriptionNumber = `RX-${dateStr}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

prescriptionSchema.index({ patient: 1, issueDate: -1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);
