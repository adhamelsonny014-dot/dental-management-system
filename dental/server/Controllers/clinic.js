const Clinic = require("../Models/Clinic");

// GET /api/clinic  — returns the single clinic document (creates it if it doesn't exist)
const getClinic = async (req, res) => {
  try {
    let clinic = await Clinic.findOne();
    if (!clinic) {
      clinic = await Clinic.create({});
    }
    return res.status(200).json(clinic);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /api/clinic  — update clinic settings
const updateClinic = async (req, res) => {
  try {
    let clinic = await Clinic.findOne();
    if (!clinic) {
      clinic = await Clinic.create(req.body);
    } else {
      Object.assign(clinic, req.body);
      await clinic.save();
    }
    return res.status(200).json(clinic);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getClinic, updateClinic };
