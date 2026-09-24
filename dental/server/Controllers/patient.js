const Patient = require("../Models/Patient");
const { createPatientWithChart } = require("../utils/patientSetup");
const { getDentistPatientIds } = require("../utils/dentistScope");

// GET /api/patients?search=&page=1&limit=20&status=active
const getAllPatients = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20, status } = req.query;
    const query = {};

    if (req.user?.role === "dentist") {
      const { patientIds } = await getDentistPatientIds(req.user);
      if (patientIds.length === 0) {
        return res.status(200).json({
          patients: [],
          total: 0,
          page: Number(page),
          totalPages: 0,
        });
      }
      query._id = { $in: patientIds };
    }

    if (search.trim()) {
      query.$or = [
        { firstName:     { $regex: search, $options: "i" } },
        { lastName:      { $regex: search, $options: "i" } },
        { phone:         { $regex: search, $options: "i" } },
        { email:         { $regex: search, $options: "i" } },
        { patientNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (status) query.status = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("firstName lastName phone email dateOfBirth gender status patientNumber createdAt");

    return res.status(200).json({
      patients,
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/patients/:id
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    return res.status(200).json(patient);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/patients
const createPatient = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ message: "First name and last name are required" });
    }
    const { patient, chart } = await createPatientWithChart(req.body);
    return res.status(201).json({ ...patient.toObject(), chartId: chart._id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /api/patients/:id
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    return res.status(200).json(patient);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/patients/:id
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    return res.status(200).json({ message: "Patient deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllPatients, getPatientById, createPatient, updatePatient, deletePatient };
