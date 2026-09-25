const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const sanitize = require("./middleware/sanitize");

const authRouter = require("./Routers/auth");
const clinicRouter = require("./Routers/clinic");
const patientRouter = require("./Routers/patient");
const staffRouter = require("./Routers/staff");
const appointmentRouter = require("./Routers/appointment");
const notificationRouter = require("./Routers/notification");
const dentalChartRouter = require("./Routers/dentalChart");
const clinicalNoteRouter = require("./Routers/clinicalNote");
const treatmentPlanRouter = require("./Routers/treatmentPlan");
const prescriptionRouter = require("./Routers/prescription");
const invoiceRouter = require("./Routers/invoice");
const paymentRouter = require("./Routers/payment");
const reportsRouter = require("./Routers/reports");
const publicRouter = require("./Routers/public");
const bookingRequestRouter = require("./Routers/bookingRequest");
const dashboardRouter = require("./Routers/dashboard");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(sanitize); // block NoSQL operator injection ($ / dotted keys)

// Rate limits for endpoints anyone can call (disabled in tests)
const limiter = (max, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
    message: { message },
  });

app.use("/api/auth/login", limiter(20, "Too many login attempts. Please try again in 15 minutes."));
app.post(
  ["/api/public/contact", "/api/public/book", "/api/public/book/direct", "/api/public/register-patient"],
  limiter(10, "Too many requests from this device. Please try again later."),
);

app.use("/api/auth", authRouter);
app.use("/api/clinic", clinicRouter);
app.use("/api/patients", patientRouter);
app.use("/api/staff", staffRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/dental-chart", dentalChartRouter);
app.use("/api/clinical-notes", clinicalNoteRouter);
app.use("/api/treatment-plans", treatmentPlanRouter);
app.use("/api/prescriptions", prescriptionRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/public", publicRouter);
app.use("/api/booking-requests", bookingRequestRouter);
app.use("/api/dashboard", dashboardRouter);

app.get("/", (req, res) => {
  res.send("Dental Management System API running.");
});

app.use("/api", notFound);
app.use(errorHandler);

module.exports = app;
