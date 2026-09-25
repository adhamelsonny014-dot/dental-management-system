const express = require("express");
const router = express.Router();
const {
  login,
  getMe,
  adminCreateAccount,
  adminListAccounts,
  adminUpdateAccount,
  adminDeleteAccount,
} = require("../Controllers/auth");
const { protect, requireRole } = require("../middleware/auth");

router.post("/login", login);
router.get("/me", protect, getMe);

// Admin-only account management (staff accounts are created here, not by public sign-up)
router.post("/admin/create-account", protect, requireRole("admin"), adminCreateAccount);
router.get("/admin/accounts", protect, requireRole("admin"), adminListAccounts);
router.put("/admin/accounts/:id", protect, requireRole("admin"), adminUpdateAccount);
router.delete("/admin/accounts/:id", protect, requireRole("admin"), adminDeleteAccount);

module.exports = router;
