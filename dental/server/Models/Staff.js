const mongoose = require("mongoose");

const scheduleSlotSchema = new mongoose.Schema({
  day:   { type: String, enum: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] },
  open:  { type: Boolean, default: true },
  start: { type: String, default: "09:00" },
  end:   { type: String, default: "18:00" },
}, { _id: false });

const staffSchema = new mongoose.Schema(
  {
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    role:        { type: String, enum: ["dentist","assistant","receptionist","hygienist","manager"], default: "dentist" },
    specialization: { type: String, default: "" },
    phone:       { type: String, default: "" },
    email:       { type: String, default: "", lowercase: true, trim: true },
    nationalId:  { type: String, default: "" },
    color:       { type: String, default: "#3b82f6" }, // used in calendar
    isActive:    { type: Boolean, default: true },
    schedule: {
      type: [scheduleSlotSchema],
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
    notes: { type: String, default: "" },
    slug: { type: String, trim: true, sparse: true, unique: true },
    featured: { type: Boolean, default: false },
    portfolioImages: { type: [String], default: [] },
    headline: { type: String, default: "" },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
    },
  },
  { timestamps: true }
);

staffSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});
staffSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Staff", staffSchema);
