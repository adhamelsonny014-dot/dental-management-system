const Appointment = require("../Models/Appointment");

const hasConflict = async (dentistId, startTime, endTime, excludeId = null) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { valid: false, message: "Invalid appointment date or time" };
  }
  if (end <= start) {
    return { valid: false, message: "End time must be after start time" };
  }

  const query = {
    dentist: dentistId,
    status: { $nin: ["cancelled", "no-show"] },
    startTime: { $lt: end },
    endTime: { $gt: start },
  };
  if (excludeId) query._id = { $ne: excludeId };

  const conflict = await Appointment.findOne(query).select("startTime endTime");
  if (conflict) {
    return {
      valid: false,
      message: `This dentist already has an appointment from ${new Date(conflict.startTime).toLocaleTimeString()} to ${new Date(conflict.endTime).toLocaleTimeString()}`,
    };
  }
  return { valid: true };
};

module.exports = { hasConflict };
