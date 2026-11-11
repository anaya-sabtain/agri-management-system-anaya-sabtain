const express = require("express");
const router = express.Router();

const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// View all expenses
router.get(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  getExpenses
);

// View single expense
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "manager"),
  getExpenseById
);

// Create expense
router.post(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  createExpense
);

// Update expense: Admin only
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateExpense
);

// Delete expense: Admin only
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteExpense
);

module.exports = router;
