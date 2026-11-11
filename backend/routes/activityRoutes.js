const express = require("express");
const router = express.Router();

const {
  getActivities,
  getActivityById,
} = require("../controllers/activityController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Get all activity logs
router.get(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  getActivities
);

// Get single activity log
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "manager"),
  getActivityById
);

module.exports = router;
