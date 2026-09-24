const mongoose = require("mongoose");

const workingHoursSchema = new mongoose.Schema({
  day:   { type: String, enum: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] },
  open:  { type: Boolean, default: true },
  start: { type: String, default: "09:00" },
  end:   { type: String, default: "18:00" },
}, { _id: false });

const clinicSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, default: "My Dental Clinic" },
    phone:       { type: String, default: "" },
    email:       { type: String, default: "" },
    address:     { type: String, default: "" },
    city:        { type: String, default: "" },
    country:     { type: String, default: "" },
    currency:    { type: String, default: "USD" },
    taxNumber:   { type: String, default: "" },
    logo:        { type: String, default: "" },
    workingHours: {
      type: [workingHoursSchema],
      default: [
        { day: "monday",    open: true,  start: "09:00", end: "18:00" },
        { day: "tuesday",   open: true,  start: "09:00", end: "18:00" },
        { day: "wednesday", open: true,  start: "09:00", end: "18:00" },
        { day: "thursday",  open: true,  start: "09:00", end: "18:00" },
        { day: "friday",    open: true,  start: "09:00", end: "17:00" },
        { day: "saturday",  open: true,  start: "10:00", end: "14:00" },
        { day: "sunday",    open: false, start: "10:00", end: "14:00" },
      ],
    },
    appointmentDuration: { type: Number, default: 30 }, // minutes
  },
  { timestamps: true }
);

module.exports = mongoose.model("Clinic", clinicSchema);
