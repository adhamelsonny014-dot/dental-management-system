const mongoose = require("mongoose");

const CONDITIONS = [
  "healthy",
  "cavity",
  "filled",
  "crown",
  "missing",
  "implant",
  "root-canal",
  "bridge",
  "veneer",
  "extraction-needed",
];

const SURFACES = ["mesial", "distal", "buccal", "lingual", "occlusal", "incisal"];

const toothSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, min: 1, max: 32 },
    condition: { type: String, enum: CONDITIONS, default: "healthy" },
    surfaces: [{ type: String, enum: SURFACES }],
    notes: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const dentalChartSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      unique: true, // one chart per patient
    },
    teeth: {
      type: [toothSchema],
      default: () =>
        Array.from({ length: 32 }, (_, i) => ({
          number: i + 1,
          condition: "healthy",
          surfaces: [],
          notes: "",
        })),
    },
    notes: { type: String, default: "" },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DentalChart", dentalChartSchema);
