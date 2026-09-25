const mongoose = require("mongoose");

const bookingRequestSchema = new mongoose.Schema(
  {
    flow: {
      type: String,
      enum: ["direct", "category"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending_admin",
        "sent_to_doctor",
        "doctor_approved",
        "doctor_rejected",
        "confirmed",
        "reschedule_requested",
        "cancelled",
      ],
      default: "pending_admin",
    },
    patientName: { type: String, required: true, trim: true },
    patientEmail: { type: String, required: true, lowercase: true, trim: true },
    patientPhone: { type: String, default: "", trim: true },
    message: { type: String, default: "" },
    serviceCategory: {
      type: String,
      enum: [
        "checkup",
        "cleaning",
        "filling",
        "whitening",
        "cosmetic",
        "orthodontics",
        "gum",
        "retainers",
        "consultation",
        "other",
        "",
      ],
      default: "",
    },
    dentist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    assignedDentist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    slotDate: { type: Date },
    slotStart: { type: String, default: "" },
    slotEnd: { type: String, default: "" },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    doctorNote: { type: String, default: "" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true },
);

bookingRequestSchema.index({ status: 1, createdAt: -1 });
bookingRequestSchema.index({ dentist: 1, slotDate: 1, slotStart: 1 });
bookingRequestSchema.index({ patientEmail: 1 });

module.exports = mongoose.model("BookingRequest", bookingRequestSchema);
