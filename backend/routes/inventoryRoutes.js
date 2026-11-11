const express = require("express");
const router = express.Router();

const {
  getInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getLowStockItems,
} = require("../controllers/inventoryController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Low stock route — MUST be before /:id
router.get(
  "/low-stock",
  protect,
  authorizeRoles("admin", "manager"),
  getLowStockItems
);

// Get all inventory items
router.get(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  getInventory
);

// Get single inventory item
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "manager"),
  getInventoryById
);

// Create inventory item
router.post(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  createInventory
);

// Update inventory item — Admin only
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateInventory
);

// Delete inventory item — Admin only
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteInventory
);

module.exports = router;
