const express = require("express");
const router = express.Router();
const { getAll, create, remove } = require("../Controllers/payment");
const { protect, requireRole } = require("../middleware/auth");

router.get("/", protect, getAll);
router.post("/", protect, requireRole("admin", "receptionist"), create);
router.delete("/:id", protect, requireRole("admin"), remove);

module.exports = router;
