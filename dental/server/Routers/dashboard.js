const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getDashboardStats } = require("../Controllers/dashboard");

router.get("/stats", protect, getDashboardStats);

module.exports = router;
