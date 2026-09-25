const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    dentist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "in-progress", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
    type: {
      type: String,
      enum: [
        "checkup",
        "cleaning",
        "filling",
        "extraction",
        "root-canal",
        "crown",
        "whitening",
        "orthodontics",
        "cosmetic",
        "gum",
        "retainers",
        "consultation",
        "other",
      ],
      default: "checkup",
    },
    reason: { type: String, default: "" },
    notes: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

appointmentSchema.index({ startTime: 1, dentist: 1 });
appointmentSchema.index({ patient: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
