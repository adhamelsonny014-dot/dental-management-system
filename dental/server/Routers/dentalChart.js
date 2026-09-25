const express = require("express");
const router = express.Router();
const { getChart, updateTooth, updateNotes } = require("../Controllers/dentalChart");
const { protect, requireRole } = require("../middleware/auth");

const chartEditor = requireRole("admin", "dentist", "assistant");

router.get("/:patientId", protect, getChart);
router.patch("/:patientId/tooth", protect, chartEditor, updateTooth);
router.patch("/:patientId/notes", protect, chartEditor, updateNotes);

module.exports = router;
