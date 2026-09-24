const Notification = require("../Models/Notification");
const User = require("../Models/User");
const Patient = require("../Models/Patient");

const notifyUsers = async ({ roleFilter, userIds, subject, body, type = "general" }) => {
  let users = [];
  if (userIds?.length) {
    users = await User.find({ _id: { $in: userIds }, isActive: true }).select("_id name");
  } else if (roleFilter?.length) {
    users = await User.find({ role: { $in: roleFilter }, isActive: true }).select("_id name");
  }
  if (!users.length) return;

  await Notification.insertMany(
    users.map((u) => ({
      type,
      channel: "in-app",
      recipient: { userId: u._id, name: u.name },
      subject,
      body,
      status: "sent",
      sentAt: new Date(),
    }))
  );
};

const notifyPatientByEmail = async ({ email, name, subject, body, type = "appointment_confirmed" }) => {
  const patient = await Patient.findOne({ email: email?.toLowerCase() });

  await Notification.create({
    type,
    channel: "email",
    recipient: {
      patientId: patient?._id,
      name: name || patient?.firstName || "Patient",
      contact: email,
    },
    subject,
    body,
    status: process.env.SMTP_HOST ? "pending" : "sent",
    sentAt: new Date(),
  });

  if (process.env.SMTP_HOST) {
    try {
      const { sendEmail } = require("./mailer");
      await sendEmail({ to: email, subject, text: body });
    } catch (err) {
      console.warn("[email]", err.message);
    }
  }
};

module.exports = { notifyUsers, notifyPatientByEmail };
