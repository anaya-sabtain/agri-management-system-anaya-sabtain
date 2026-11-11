const express = require("express");
const router = express.Router();

const {
  getMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
} = require("../controllers/maintenanceController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Get all maintenance records
router.get(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  getMaintenance
);

// Get single maintenance record
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "manager"),
  getMaintenanceById
);

// Create maintenance record
router.post(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  createMaintenance
);

// Update maintenance — Admin only
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateMaintenance
);

// Delete maintenance — Admin only
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteMaintenance
);

module.exports = router;