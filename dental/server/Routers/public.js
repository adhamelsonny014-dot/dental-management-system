const express = require("express");
const router = express.Router();
const {
  getPublicClinic,
  getPublicStaff,
  getFeaturedDoctors,
  getPublicSlots,
  submitContact,
  submitBooking,
  submitDirectBooking,
  registerPatient,
} = require("../Controllers/public");

router.get("/clinic", getPublicClinic);
router.get("/staff", getPublicStaff);
router.get("/featured-doctors", getFeaturedDoctors);
router.get("/slots/:dentistId", getPublicSlots);
router.post("/contact", submitContact);
router.post("/book", submitBooking);
router.post("/book/direct", submitDirectBooking);
router.post("/register-patient", registerPatient);

module.exports = router;
