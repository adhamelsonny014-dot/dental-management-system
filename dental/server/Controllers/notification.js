const Notification = require("../Models/Notification");
const Appointment  = require("../Models/Appointment");

const POPULATE = [
  { path: "recipient.patientId", select: "firstName lastName phone email" },
  { path: "appointment", select: "startTime endTime type status",
    populate: [
      { path: "patient", select: "firstName lastName" },
      { path: "dentist", select: "firstName lastName" },
    ],
  },
];

// GET /api/notifications?status=&channel=&page=1&limit=20
const getAll = async (req, res) => {
  try {
    const { status, channel, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status)  query.status  = status;
    if (channel) query.channel = channel;

    // Doctors only see their own notifications
    if (req.user.role === "dentist") {
      query["recipient.userId"] = req.user._id;
    }
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .populate(POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({ notifications, total,
      page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/notifications/unread-count  — for bell badge
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      "recipient.userId": req.user._id,
      status: { $in: ["pending", "sent"] },
    });
    return res.status(200).json({ count });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/notifications  — create / send a notification manually
const create = async (req, res) => {
  try {
    const notification = await Notification.create({
      ...req.body,
      status: "sent",
      sentAt: new Date(),
    });
    return res.status(201).json(notification);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/notifications/send-reminder/:appointmentId
const sendReminder = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.appointmentId)
      .populate("patient", "firstName lastName phone email")
      .populate("dentist", "firstName lastName");

    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    const patient   = appt.patient;
    const dentist   = appt.dentist;
    const dateStr   = new Date(appt.startTime).toLocaleString("en-US", {
      weekday: "long", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const body = `Dear ${patient.firstName}, this is a reminder for your appointment with Dr. ${dentist.lastName} on ${dateStr}. Please arrive 10 minutes early.`;

    const notif = await Notification.create({
      type:        "appointment_reminder",
      channel:     req.body.channel || "sms",
      recipient: {
        patientId: patient._id,
        name:      `${patient.firstName} ${patient.lastName}`,
        contact:   req.body.channel === "email" ? patient.email : patient.phone,
      },
      subject:     "Appointment Reminder",
      body,
      status:      "sent",
      sentAt:      new Date(),
      appointment: appt._id,
    });

    return res.status(201).json(notif);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { status: "read", readAt: new Date() },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    return res.status(200).json(notif);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/notifications/mark-all-read
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { "recipient.userId": req.user._id, status: { $in: ["pending","sent"] } },
      { status: "read", readAt: new Date() }
    );
    return res.status(200).json({ message: "All marked as read" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/notifications/:id
const remove = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll, getUnreadCount, create, sendReminder, markRead, markAllRead, remove };
