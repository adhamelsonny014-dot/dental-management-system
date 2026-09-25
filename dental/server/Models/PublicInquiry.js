const mongoose = require("mongoose");

const publicInquirySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["contact", "booking"],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    subject: { type: String, default: "" },
    message: { type: String, default: "" },
    // Booking-specific
    preferredDate: { type: Date },
    preferredTime: { type: String, default: "" },
    serviceType: {
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
        "",
      ],
      default: "",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "scheduled", "closed"],
      default: "new",
    },
  },
  { timestamps: true },
);

publicInquirySchema.index({ type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("PublicInquiry", publicInquirySchema);
