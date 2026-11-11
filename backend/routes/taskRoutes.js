const express = require("express");
const router = express.Router();

const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// View all tasks
router.get(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  getTasks
);

// View single task
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "manager"),
  getTaskById
);

// Create task
router.post(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  createTask
);

// Update task: Admin only
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateTask
);

// Delete task: Admin only
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteTask
);

module.exports = router;
