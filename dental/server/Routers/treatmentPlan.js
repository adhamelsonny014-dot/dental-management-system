const express = require("express");
const router  = express.Router();
const {
  getAll, getById, create, update,
  updateStatus, updateProcedure, remove, getReport,
} = require("../Controllers/treatmentPlan");
const { protect } = require("../middleware/auth");

router.get("/",                              protect, getAll);
router.get("/:id/report",                    protect, getReport);
router.get("/:id",                           protect, getById);
router.post("/",                             protect, create);
router.put("/:id",                           protect, update);
router.patch("/:id/status",                  protect, updateStatus);
router.patch("/:id/procedure/:procId",       protect, updateProcedure);
router.delete("/:id",                        protect, remove);

module.exports = router;
