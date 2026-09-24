const express = require("express");
const router  = express.Router();
const {
  getAll, getUnreadCount, create, sendReminder,
  markRead, markAllRead, remove,
} = require("../Controllers/notification");
const { protect } = require("../middleware/auth");

router.get("/",                             protect, getAll);
router.get("/unread-count",                 protect, getUnreadCount);
router.post("/",                            protect, create);
router.post("/send-reminder/:appointmentId",protect, sendReminder);
router.patch("/:id/read",                   protect, markRead);
router.patch("/mark-all-read",              protect, markAllRead);
router.delete("/:id",                       protect, remove);

module.exports = router;
