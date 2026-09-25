const express = require("express");
const router = express.Router();
const { getAll, getById, create, update, dispense, remove } = require("../Controllers/prescription");
const { protect, requireRole } = require("../middleware/auth");

const clinician = requireRole("admin", "dentist");

router.get("/", protect, getAll);
router.get("/:id", protect, getById);
router.post("/", protect, clinician, create);
router.put("/:id", protect, clinician, update);
router.patch("/:id/dispense", protect, requireRole("admin", "dentist", "assistant"), dispense);
router.delete("/:id", protect, clinician, remove);

module.exports = router;
