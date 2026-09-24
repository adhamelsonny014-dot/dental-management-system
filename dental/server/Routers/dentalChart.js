const express = require("express");
const router  = express.Router();
const { getChart, updateTooth, updateNotes } = require("../Controllers/dentalChart");
const { protect } = require("../middleware/auth");

router.get("/:patientId",              protect, getChart);
router.patch("/:patientId/tooth",      protect, updateTooth);
router.patch("/:patientId/notes",      protect, updateNotes);

module.exports = router;
