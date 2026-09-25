const mongoose = require("mongoose");

// One document per sequence (e.g. "patient", "invoice"); seq is the last number handed out.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model("Counter", counterSchema);
