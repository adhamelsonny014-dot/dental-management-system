const Staff = require("../Models/Staff");
const Patient = require("../Models/Patient");
const Appointment = require("../Models/Appointment");
const TreatmentPlan = require("../Models/TreatmentPlan");

/** The Staff record behind a login (linked by userId, or matched by email). */
const findStaffForUser = (user) => Staff.findOne({ $or: [{ userId: user._id }, { email: user.email }] });

/** Patient IDs linked to a dentist via appointments, treatment plans, or patients they added. */
const getDentistPatientIds = async (user) => {
  const staff = await findStaffForUser(user);
  const fromCreated = await Patient.distinct("_id", { createdBy: user._id });
  if (!staff) return { staffId: null, patientIds: fromCreated.map(String) };

  const fromAppts = await Appointment.distinct("patient", {
    dentist: staff._id,
    status: { $nin: ["cancelled"] },
  });
  const fromPlans = await TreatmentPlan.distinct("patient", { dentist: staff._id });
  const patientIds = [
    ...new Set([...fromAppts.map(String), ...fromPlans.map(String), ...fromCreated.map(String)]),
  ];

  return { staffId: staff._id, patientIds };
};

/** Dentists may only access their own patients; other staff roles can access all. */
const canAccessPatient = async (user, patientId) => {
  if (user?.role !== "dentist") return true;
  const { patientIds } = await getDentistPatientIds(user);
  return patientIds.includes(String(patientId));
};

module.exports = { findStaffForUser, getDentistPatientIds, canAccessPatient };
