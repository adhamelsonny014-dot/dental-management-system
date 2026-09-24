const Staff = require("../Models/Staff");
const Appointment = require("../Models/Appointment");
const TreatmentPlan = require("../Models/TreatmentPlan");

/** Patient IDs linked to a dentist via appointments or treatment plans. */
const getDentistPatientIds = async (user) => {
  const staff = await Staff.findOne({
    $or: [{ userId: user._id }, { email: user.email }],
  });
  if (!staff) return { staffId: null, patientIds: [] };

  const fromAppts = await Appointment.distinct("patient", {
    dentist: staff._id,
    status: { $nin: ["cancelled"] },
  });
  const fromPlans = await TreatmentPlan.distinct("patient", { dentist: staff._id });
  const patientIds = [...new Set([...fromAppts.map(String), ...fromPlans.map(String)])];

  return { staffId: staff._id, patientIds };
};

module.exports = { getDentistPatientIds };
