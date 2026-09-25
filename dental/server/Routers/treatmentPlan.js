const express = require("express");
const router = express.Router();
const {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  updateProcedure,
  remove,
  getReport,
} = require("../Controllers/treatmentPlan");
const { protect, requireRole } = require("../middleware/auth");

const clinician = requireRole("admin", "dentist");

router.get("/", protect, getAll);
router.get("/:id/report", protect, getReport);
router.get("/:id", protect, getById);
router.post("/", protect, clinician, create);
router.put("/:id", protect, clinician, update);
router.patch("/:id/status", protect, clinician, updateStatus);
router.patch("/:id/procedure/:procId", protect, clinician, updateProcedure);
router.delete("/:id", protect, clinician, remove);

module.exports = router;
