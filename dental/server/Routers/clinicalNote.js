const express = require("express");
const router = express.Router();
const { getAll, getById, create, update, remove } = require("../Controllers/clinicalNote");
const { protect, requireRole } = require("../middleware/auth");

// Anyone on staff can read notes; only clinicians can write them
const clinician = requireRole("admin", "dentist");

router.get("/", protect, getAll);
router.get("/:id", protect, getById);
router.post("/", protect, clinician, create);
router.put("/:id", protect, clinician, update);
router.delete("/:id", protect, clinician, remove);

module.exports = router;
