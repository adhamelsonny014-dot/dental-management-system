const express = require("express");
const router = express.Router();
const {
  getAll,
  getById,
  create,
  createFromPlan,
  update,
  updateStatus,
  remove,
} = require("../Controllers/invoice");
const { protect, requireRole } = require("../middleware/auth");

// Billing is handled by the front desk; only admins can delete
const billing = requireRole("admin", "receptionist");

router.get("/", protect, getAll);
router.get("/:id", protect, getById);
router.post("/", protect, billing, create);
router.post("/from-plan/:planId", protect, billing, createFromPlan);
router.put("/:id", protect, billing, update);
router.patch("/:id/status", protect, billing, updateStatus);
router.delete("/:id", protect, requireRole("admin"), remove);

module.exports = router;
