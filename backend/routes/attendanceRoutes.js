const express = require("express");
const router = express.Router();

const {
  getAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} = require("../controllers/attendanceController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Get all attendance records
router.get(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  getAttendance
);

// Get single attendance record
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "manager"),
  getAttendanceById
);

// Create attendance
router.post(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  createAttendance
);

// Update attendance — Admin only
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateAttendance
);

// Delete attendance — Admin only
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteAttendance
);

module.exports = router;
