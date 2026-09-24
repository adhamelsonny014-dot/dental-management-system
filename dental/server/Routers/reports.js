const express = require("express");
const router  = express.Router();
const {
  overview,
  revenueByMonth,
  appointmentsByMonth,
  appointmentsByType,
  patientsGrowth,
  revenueByDentist,
  paymentMethods,
  topProcedures,
  treatmentPlansSummary,
} = require("../Controllers/reports");
const { protect } = require("../middleware/auth");

router.get("/overview",               protect, overview);
router.get("/revenue-by-month",       protect, revenueByMonth);
router.get("/appointments-by-month",  protect, appointmentsByMonth);
router.get("/appointments-by-type",   protect, appointmentsByType);
router.get("/patients-growth",        protect, patientsGrowth);
router.get("/revenue-by-dentist",     protect, revenueByDentist);
router.get("/payment-methods",        protect, paymentMethods);
router.get("/top-procedures",         protect, topProcedures);
router.get("/treatment-plans",        protect, treatmentPlansSummary);

module.exports = router;
