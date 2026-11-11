const express = require("express");
const router = express.Router();

const {
  getWorkers,
  getWorkerById,
  createWorker,
  updateWorker,
  deleteWorker,
} = require("../controllers/workerController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Get all workers
router.get(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  getWorkers
);

// Get single worker
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "manager"),
  getWorkerById
);

// Create worker
router.post(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  createWorker
);

// Update worker — Admin only
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateWorker
);

// Delete worker — Admin only
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteWorker
);

module.exports = router;
