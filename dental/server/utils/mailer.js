const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.SMTP_HOST) {
    console.log(`[email preview] To: ${to} | ${subject}\n${text}`);
    return;
  }

  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch {
    throw new Error("SMTP is configured but nodemailer is not installed (run: npm install nodemailer)");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    // Text can contain names typed by website visitors, so escape it before building HTML
    html: html || `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`,
  });
};

module.exports = { sendEmail };
