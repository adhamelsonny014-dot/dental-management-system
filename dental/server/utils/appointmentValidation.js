const Appointment = require("../Models/Appointment");
const Staff = require("../Models/Staff");
const { DAY_NAMES, parseTime } = require("./slots");

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

/** Checks the dentist works at that time (weekly schedule) and has no clashing appointment. */
const checkDentistAvailability = async (dentistId, startTime, endTime, excludeId = null) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { valid: false, message: "Invalid appointment date or time" };
  }

  const staff = await Staff.findById(dentistId);
  if (!staff || !staff.isActive) {
    return { valid: false, message: "Dentist not found or inactive" };
  }

  const schedule = staff.schedule?.find((s) => s.day === DAY_NAMES[start.getDay()]);
  const startMins = start.getHours() * 60 + start.getMinutes();
  const endMins = end.getHours() * 60 + end.getMinutes();
  const withinHours =
    schedule?.open &&
    start.toDateString() === end.toDateString() &&
    startMins >= parseTime(schedule.start) &&
    endMins <= parseTime(schedule.end);
  if (!withinHours) {
    return { valid: false, message: `Dr. ${staff.lastName} is not working at that time` };
  }

  return hasConflict(dentistId, start, end, excludeId);
};

module.exports = { hasConflict, checkDentistAvailability };
