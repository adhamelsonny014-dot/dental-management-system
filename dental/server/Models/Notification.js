const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["appointment_reminder", "appointment_confirmed", "appointment_cancelled",
             "appointment_rescheduled", "general"],
      default: "general",
    },
    channel: {
      type: String,
      enum: ["email", "sms", "in-app"],
      default: "in-app",
    },
    recipient: {
      // Either a patient or a user (staff)
      patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
      userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name:      { type: String, default: "" },
      contact:   { type: String, default: "" }, // email or phone
    },
    subject:    { type: String, default: "" },
    body:       { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "read"],
      default: "pending",
    },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    readAt:      { type: Date },
    sentAt:      { type: Date },
    error:       { type: String, default: "" },
  },
  { timestamps: true }
);

notificationSchema.index({ "recipient.userId": 1, status: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
