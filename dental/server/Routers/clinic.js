const express = require("express");
const router  = express.Router();
const { getClinic, updateClinic } = require("../Controllers/clinic");
const { protect, requireRole }    = require("../middleware/auth");

router.get("/",  protect, getClinic);
router.put("/",  protect, requireRole("admin"), updateClinic);

module.exports = router;
