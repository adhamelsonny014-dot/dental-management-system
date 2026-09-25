const Notification = require("../Models/Notification");
const Appointment = require("../Models/Appointment");
const { deliver } = require("../utils/notify");
const asyncHandler = require("../utils/asyncHandler");
const { FIELDS, pick } = require("../utils/fields");
const { paginate } = require("../utils/paginate");

// Admins manage everything; staff manage their own in-app notifications;
// patient-facing messages (no userId) are managed by admin and reception.
const canManage = (notification, user) => {
  if (user.role === "admin") return true;
  if (notification.recipient?.userId) {
    return String(notification.recipient.userId) === String(user._id);
  }
  return user.role === "receptionist";
};

const POPULATE = [
  { path: "recipient.patientId", select: "firstName lastName phone email" },
  {
    path: "appointment",
    select: "startTime endTime type status",
    populate: [
      { path: "patient", select: "firstName lastName" },
      { path: "dentist", select: "firstName lastName" },
    ],
  },
];

// GET /api/notifications?status=&channel=&page=1&limit=20
const getAll = asyncHandler(async (req, res) => {
  const { status, channel, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (channel) query.channel = channel;

  // Admin sees everything; reception also sees patient-facing messages;
  // everyone else only sees their own notifications
  if (req.user.role === "receptionist") {
    query.$or = [{ "recipient.userId": req.user._id }, { "recipient.userId": null }];
  } else if (req.user.role !== "admin") {
    query["recipient.userId"] = req.user._id;
  }
  const { items, ...meta } = await paginate(Notification, query, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: POPULATE,
  });
  return res.status(200).json({ notifications: items, ...meta });
});

// GET /api/notifications/unread-count  — for bell badge
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    "recipient.userId": req.user._id,
    status: { $in: ["pending", "sent"] },
  });
  return res.status(200).json({ count });
});

// POST /api/notifications  — create / send a notification manually
const create = asyncHandler(async (req, res) => {
  const notification = await Notification.create({
    ...pick(req.body, FIELDS.notification),
    recipient: pick(req.body.recipient, FIELDS.notificationRecipient),
    status: "pending",
    sentAt: undefined,
  });
  // Records whether it was really delivered (sent / pending / failed)
  return res.status(201).json(await deliver(notification));
});

// POST /api/notifications/send-reminder/:appointmentId
const sendReminder = asyncHandler(async (req, res) => {
  const appt = await Appointment.findById(req.params.appointmentId)
    .populate("patient", "firstName lastName phone email")
    .populate("dentist", "firstName lastName");

  if (!appt) return res.status(404).json({ message: "Appointment not found" });

  const patient = appt.patient;
  const dentist = appt.dentist;
  if (!patient) return res.status(400).json({ message: "This appointment has no patient" });
  const dateStr = new Date(appt.startTime).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const body = `Dear ${patient.firstName}, this is a reminder for your appointment with Dr. ${dentist?.lastName || ""} on ${dateStr}. Please arrive 10 minutes early.`;
  const channel = req.body.channel === "email" ? "email" : "sms";

  const notif = await Notification.create({
    type: "appointment_reminder",
    channel,
    recipient: {
      patientId: patient._id,
      name: `${patient.firstName} ${patient.lastName}`,
      contact: channel === "email" ? patient.email : patient.phone,
    },
    subject: "Appointment Reminder",
    body,
    status: "pending",
    appointment: appt._id,
  });

  return res.status(201).json(await deliver(notif));
});

// PATCH /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findById(req.params.id);
  if (!notif) return res.status(404).json({ message: "Notification not found" });
  if (!canManage(notif, req.user)) return res.status(403).json({ message: "Not your notification" });

  notif.status = "read";
  notif.readAt = new Date();
  await notif.save();
  return res.status(200).json(notif);
});

// PATCH /api/notifications/mark-all-read
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { "recipient.userId": req.user._id, status: { $in: ["pending", "sent"] } },
    { status: "read", readAt: new Date() },
  );
  return res.status(200).json({ message: "All marked as read" });
});

// DELETE /api/notifications/:id
const remove = asyncHandler(async (req, res) => {
  const notif = await Notification.findById(req.params.id);
  if (!notif) return res.status(404).json({ message: "Notification not found" });
  if (!canManage(notif, req.user)) return res.status(403).json({ message: "Not your notification" });

  await notif.deleteOne();
  return res.status(200).json({ message: "Deleted" });
});

module.exports = { getAll, getUnreadCount, create, sendReminder, markRead, markAllRead, remove };
