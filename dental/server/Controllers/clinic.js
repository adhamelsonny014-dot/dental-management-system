const Clinic = require("../Models/Clinic");
const asyncHandler = require("../utils/asyncHandler");
const { FIELDS, pick } = require("../utils/fields");

// GET /api/clinic  — returns the single clinic document (creates it if it doesn't exist)
const getClinic = asyncHandler(async (req, res) => {
  const clinic = await Clinic.getSettings();
  return res.status(200).json(clinic);
});

// PUT /api/clinic  — update clinic settings
const updateClinic = asyncHandler(async (req, res) => {
  const clinic = await Clinic.getSettings();
  Object.assign(clinic, pick(req.body, FIELDS.clinic));
  await clinic.save();
  return res.status(200).json(clinic);
});

module.exports = { getClinic, updateClinic };
