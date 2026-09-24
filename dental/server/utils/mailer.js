const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.SMTP_HOST) {
    console.log(`[email preview] To: ${to} | ${subject}\n${text}`);
    return;
  }

  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch {
    console.log(`[email preview] To: ${to} | ${subject}\n${text}`);
    return;
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
    html: html || `<p>${text.replace(/\n/g, "<br>")}</p>`,
  });
};

module.exports = { sendEmail };
