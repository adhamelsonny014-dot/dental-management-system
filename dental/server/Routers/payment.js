const express = require("express");
const router  = express.Router();
const { getAll, create, remove } = require("../Controllers/payment");
const { protect } = require("../middleware/auth");

router.get("/",      protect, getAll);
router.post("/",     protect, create);
router.delete("/:id",protect, remove);

module.exports = router;
