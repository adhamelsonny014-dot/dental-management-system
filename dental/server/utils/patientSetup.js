const Patient = require("../Models/Patient");
const DentalChart = require("../Models/DentalChart");

const createPatientWithChart = async (patientData) => {
  const patient = await Patient.create(patientData);
  const chart = await DentalChart.create({ patient: patient._id });
  return { patient, chart };
};

module.exports = { createPatientWithChart };
