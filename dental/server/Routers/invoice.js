const express = require("express");
const router  = express.Router();
const {
  getAll, getById, create, createFromPlan,
  update, updateStatus, remove,
} = require("../Controllers/invoice");
const { protect } = require("../middleware/auth");

router.get("/",                              protect, getAll);
router.get("/:id",                           protect, getById);
router.post("/",                             protect, create);
router.post("/from-plan/:planId",            protect, createFromPlan);
router.put("/:id",                           protect, update);
router.patch("/:id/status",                  protect, updateStatus);
router.delete("/:id",                        protect, remove);

module.exports = router;
