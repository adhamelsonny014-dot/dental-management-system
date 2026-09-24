const express = require("express");
const router  = express.Router();
const {
  getAllStaff, getStaffById, createStaff, updateStaff, deleteStaff, createStaffAccount,
} = require("../Controllers/staff");
const { protect, requireRole } = require("../middleware/auth");

router.get("/",      protect, getAllStaff);
router.get("/:id",   protect, getStaffById);
router.post("/",     protect, requireRole("admin"), createStaff);
router.put("/:id",   protect, requireRole("admin"), updateStaff);
router.delete("/:id",protect, requireRole("admin"), deleteStaff);
router.post("/:id/create-account", protect, requireRole("admin"), createStaffAccount);

module.exports = router;
