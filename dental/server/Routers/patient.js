const express = require("express");
const router  = express.Router();
const {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} = require("../Controllers/patient");
const { protect, requireRole } = require("../middleware/auth");

router.get("/",     protect, getAllPatients);
router.get("/:id",  protect, getPatientById);
router.post("/",    protect, createPatient);
router.put("/:id",  protect, updatePatient);
router.delete("/:id", protect, requireRole("admin", "dentist"), deletePatient);

module.exports = router;
