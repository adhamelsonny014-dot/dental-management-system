const mongoose = require("mongoose");
const { nextSequence } = require("../utils/sequence");

const patientSchema = new mongoose.Schema(
  {
    // Basic info
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    nationalId: { type: String, default: "" },
    photo: { type: String, default: "" },

    // Contact
    phone: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true, trim: true },
    address: { type: String, default: "" },
    city: { type: String, default: "" },

    // Emergency contact
    emergencyContact: {
      name: { type: String, default: "" },
      relationship: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    // Medical history
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"],
      default: "unknown",
    },
    allergies: [{ type: String }],
    medications: [{ type: String }],
    medicalNotes: { type: String, default: "" },
    conditions: [{ type: String }],

    // System
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    patientNumber: { type: String, unique: true },
    referredBy: { type: String, default: "" },
    notes: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Auto-generate patient number before save
patientSchema.pre("save", async function (next) {
  if (!this.patientNumber) {
    const seq = await nextSequence("patient", mongoose.model("Patient"), "patientNumber");
    this.patientNumber = `P${String(seq).padStart(5, "0")}`;
  }
  next();
});

// Virtual: full name
patientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

patientSchema.set("toJSON", { virtuals: true });
patientSchema.set("toObject", { virtuals: true });

// Text search index
patientSchema.index({
  firstName: "text",
  lastName: "text",
  phone: "text",
  email: "text",
  patientNumber: "text",
});

module.exports = mongoose.model("Patient", patientSchema);
