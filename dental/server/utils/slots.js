const Appointment = require("../Models/Appointment");
const BookingRequest = require("../Models/BookingRequest");

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const parseTime = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

const formatTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const generateSlotTimes = (start, end, durationMins = 30) => {
  const slots = [];
  let cur = parseTime(start);
  const endMins = parseTime(end);
  while (cur + durationMins <= endMins) {
    slots.push({
      start: formatTime(cur),
      end: formatTime(cur + durationMins),
    });
    cur += durationMins;
  }
  return slots;
};

const slotKey = (date, start) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return `${d.toISOString().slice(0, 10)}_${start}`;
};

const getBookedSlotKeys = async (dentistId, date) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const keys = new Set();

  const appointments = await Appointment.find({
    dentist: dentistId,
    startTime: { $gte: dayStart, $lte: dayEnd },
    status: { $nin: ["cancelled", "no-show"] },
  }).select("startTime");

  appointments.forEach((a) => {
    const t = new Date(a.startTime);
    keys.add(slotKey(dayStart, formatTime(t.getHours() * 60 + t.getMinutes())));
  });

  const requests = await BookingRequest.find({
    dentist: dentistId,
    slotDate: { $gte: dayStart, $lte: dayEnd },
    status: { $in: ["pending_admin", "sent_to_doctor", "doctor_approved", "confirmed"] },
  }).select("slotDate slotStart");

  requests.forEach((r) => {
    if (r.slotStart) keys.add(slotKey(r.slotDate, r.slotStart));
  });

  return keys;
};

const getAvailableSlotsForDay = async (staff, dateStr, durationMins = 30) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return [];

  const dayName = DAY_NAMES[date.getDay()];
  const schedule = staff.schedule?.find((s) => s.day === dayName);
  if (!schedule?.open) return [];

  const allSlots = generateSlotTimes(schedule.start, schedule.end, durationMins);
  const booked = await getBookedSlotKeys(staff._id, date);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = date.toDateString() === new Date().toDateString();
  const nowMins = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;

  return allSlots.filter((s) => {
    if (booked.has(slotKey(date, s.start))) return false;
    if (isToday && parseTime(s.start) <= nowMins + 30) return false;
    return true;
  });
};

module.exports = {
  DAY_NAMES,
  getAvailableSlotsForDay,
  generateSlotTimes,
  parseTime,
  formatTime,
};
