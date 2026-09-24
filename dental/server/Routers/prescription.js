const express = require("express");
const router  = express.Router();
const { getAll, getById, create, update, dispense, remove } = require("../Controllers/prescription");
const { protect } = require("../middleware/auth");

router.get("/",                protect, getAll);
router.get("/:id",             protect, getById);
router.post("/",               protect, create);
router.put("/:id",             protect, update);
router.patch("/:id/dispense",  protect, dispense);
router.delete("/:id",          protect, remove);

module.exports = router;
