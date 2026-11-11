const express = require("express");
const router = express.Router();

const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// View all orders
router.get(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  getOrders
);

// View single order
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "manager"),
  getOrderById
);

// Create order
router.post(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  createOrder
);

// Update order: Admin only
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateOrder
);

// Delete order: Admin only
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteOrder
);

module.exports = router;
