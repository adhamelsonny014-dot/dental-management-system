const express = require("express");
const router  = express.Router();
const {
  getAllAppointments, getAppointmentById,
  createAppointment, updateAppointment,
  updateStatus, deleteAppointment,
} = require("../Controllers/appointment");
const { protect } = require("../middleware/auth");

router.get("/",              protect, getAllAppointments);
router.get("/:id",           protect, getAppointmentById);
router.post("/",             protect, createAppointment);
router.put("/:id",           protect, updateAppointment);
router.patch("/:id/status",  protect, updateStatus);
router.delete("/:id",        protect, deleteAppointment);

module.exports = router;
