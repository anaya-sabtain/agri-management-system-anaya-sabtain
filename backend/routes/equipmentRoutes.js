const express = require("express");
const router = express.Router();

const {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} = require("../controllers/equipmentController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Get all equipment
router.get(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  getEquipment
);

// Get single equipment
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "manager"),
  getEquipmentById
);

// Create equipment
router.post(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  createEquipment
);

// Update equipment — Admin only
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateEquipment
);

// Delete equipment — Admin only
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteEquipment
);

module.exports = router;
