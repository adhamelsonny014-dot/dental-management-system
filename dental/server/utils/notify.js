const Notification = require("../Models/Notification");
const User = require("../Models/User");
const Patient = require("../Models/Patient");
const { sendEmail } = require("./mailer");

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
    })),
  );
};

/**
 * Tries to deliver a saved notification and records the real outcome,
 * so the UI never shows "sent" for a message that was not sent.
 */
const deliver = async (notification) => {
  const { channel, recipient, subject, body } = notification;

  if (channel === "in-app") {
    notification.status = "sent";
    notification.sentAt = new Date();
  } else if (channel === "sms") {
    notification.status = "failed";
    notification.error = "SMS sending is not configured";
  } else if (!recipient?.contact) {
    notification.status = "failed";
    notification.error = "No email address on file";
  } else if (!process.env.SMTP_HOST) {
    notification.status = "pending";
    notification.error = "Email not sent: SMTP is not configured";
  } else {
    try {
      await sendEmail({ to: recipient.contact, subject, text: body });
      notification.status = "sent";
      notification.sentAt = new Date();
      notification.error = "";
    } catch (err) {
      notification.status = "failed";
      notification.error = err.message;
      console.warn("[email]", err.message);
    }
  }

  await notification.save();
  return notification;
};

const notifyPatientByEmail = async ({ email, name, subject, body, type = "appointment_confirmed" }) => {
  const patient = await Patient.findOne({ email: email?.toLowerCase() });

  const notification = await Notification.create({
    type,
    channel: "email",
    recipient: {
      patientId: patient?._id,
      name: name || patient?.firstName || "Patient",
      contact: email,
    },
    subject,
    body,
    status: "pending",
  });

  return deliver(notification);
};

module.exports = { notifyUsers, notifyPatientByEmail, deliver };
