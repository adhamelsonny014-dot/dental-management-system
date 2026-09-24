const mongoose = require("mongoose");

const clinicalNoteSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    dentist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    visitDate: {
      type: Date,
      default: Date.now,
    },
    // SOAP format
    subjective:  { type: String, default: "" }, // Patient complaints / chief complaint
    objective:   { type: String, default: "" }, // Clinical findings / exam results
    assessment:  { type: String, default: "" }, // Diagnosis / assessment
    plan:        { type: String, default: "" }, // Treatment plan / next steps

    // Extras
    procedures:  [{ type: String }],            // Procedures performed
    vitals: {
      bloodPressure: { type: String, default: "" },
      pulse:         { type: String, default: "" },
      temperature:   { type: String, default: "" },
    },
    followUpDate:  { type: Date },
    isPrivate:     { type: Boolean, default: false }, // hidden from patient portal
  },
  { timestamps: true }
);

clinicalNoteSchema.index({ patient: 1, visitDate: -1 });
clinicalNoteSchema.index({ appointment: 1 });

module.exports = mongoose.model("ClinicalNote", clinicalNoteSchema);
