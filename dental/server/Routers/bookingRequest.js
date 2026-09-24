const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/auth");
const {
  listBookingRequests,
  sendToDoctor,
  assignDentist,
  doctorResponse,
  confirmPatient,
  cancelRequest,
} = require("../Controllers/bookingRequest");

router.get("/", protect, listBookingRequests);
router.patch("/:id/send-to-doctor", protect, requireRole("admin", "receptionist"), sendToDoctor);
router.patch("/:id/assign", protect, requireRole("admin", "receptionist"), assignDentist);
router.patch("/:id/doctor-response", protect, requireRole("admin", "dentist"), doctorResponse);
router.patch("/:id/confirm-patient", protect, requireRole("admin", "receptionist"), confirmPatient);
router.patch("/:id/cancel", protect, requireRole("admin", "receptionist"), cancelRequest);

module.exports = router;
