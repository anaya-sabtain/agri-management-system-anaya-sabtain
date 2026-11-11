const { Expense, Crop } = require("../models");
const logActivity = require("../utils/activityLogger");

// GET ALL EXPENSES
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      include: [
        {
          model: Crop,
          as: "crop",
          attributes: ["id", "name", "field"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      succeeded: true,
      message: "Expenses fetched successfully.",
      data: expenses,
    });
  } catch (error) {
    console.error("Get Expenses Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to fetch expenses.",
      data: null,
    });
  }
};

// GET SINGLE EXPENSE
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id, {
      include: [
        {
          model: Crop,
          as: "crop",
          attributes: ["id", "name", "field"],
        },
      ],
    });

    if (!expense) {
      return res.status(404).json({
        succeeded: false,
        message: "Expense not found.",
        data: null,
      });
    }

    return res.status(200).json({
      succeeded: true,
      message: "Expense fetched successfully.",
      data: expense,
    });
  } catch (error) {
    console.error("Get Expense Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to fetch expense.",
      data: null,
    });
  }
};

// CREATE EXPENSE
const createExpense = async (req, res) => {
  try {
    const { cropId, category, amount, date, note } = req.body;

    if (!category || amount === undefined || !date) {
      return res.status(400).json({
        succeeded: false,
        message: "Category, amount and date are required.",
        data: null,
      });
    }

    const allowedCategories = [
      "Seeds",
      "Fertilizer",
      "Labour",
      "Fuel",
      "Repair",
      "Other",
    ];

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        succeeded: false,
        message: "Invalid expense category.",
        data: null,
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        succeeded: false,
        message: "Amount must be greater than zero.",
        data: null,
      });
    }

    if (cropId) {
      const crop = await Crop.findByPk(cropId);

      if (!crop) {
        return res.status(404).json({
          succeeded: false,
          message: "Selected crop does not exist.",
          data: null,
        });
      }
    }

    const expense = await Expense.create({
      cropId: cropId || null,
      category,
      amount: numericAmount,
      date,
      note,
    });

    await logActivity({
      user: req.user.username,
      action: "add",
      entity: "Expense",
      entityId: expense.id,
    });

    return res.status(201).json({
      succeeded: true,
      message: "Expense created successfully.",
      data: expense,
    });
  } catch (error) {
    console.error("Create Expense Error:", error.message);

    return res.status(400).json({
      succeeded: false,
      message: "Failed to create expense. Please check your input.",
      data: null,
    });
  }
};

// UPDATE EXPENSE
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).json({
        succeeded: false,
        message: "Expense not found.",
        data: null,
      });
    }

    const allowedFields = [
      "cropId",
      "category",
      "amount",
      "date",
      "note",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const allowedCategories = [
      "Seeds",
      "Fertilizer",
      "Labour",
      "Fuel",
      "Repair",
      "Other",
    ];

    if (
      updates.category !== undefined &&
      !allowedCategories.includes(updates.category)
    ) {
      return res.status(400).json({
        succeeded: false,
        message: "Invalid expense category.",
        data: null,
      });
    }

    if (updates.amount !== undefined) {
      const numericAmount = Number(updates.amount);

      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
          succeeded: false,
          message: "Amount must be greater than zero.",
          data: null,
        });
      }

      updates.amount = numericAmount;
    }

    if (updates.cropId) {
      const crop = await Crop.findByPk(updates.cropId);

      if (!crop) {
        return res.status(404).json({
          succeeded: false,
          message: "Selected crop does not exist.",
          data: null,
        });
      }
    }

    await expense.update(updates);

    await logActivity({
      user: req.user.username,
      action: "edit",
      entity: "Expense",
      entityId: expense.id,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Expense updated successfully.",
      data: expense,
    });
  } catch (error) {
    console.error("Update Expense Error:", error.message);

    return res.status(400).json({
      succeeded: false,
      message: "Failed to update expense.",
      data: null,
    });
  }
};

// DELETE EXPENSE
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).json({
        succeeded: false,
        message: "Expense not found.",
        data: null,
      });
    }

    const deletedExpenseId = expense.id;

    await expense.destroy();

    await logActivity({
      user: req.user.username,
      action: "delete",
      entity: "Expense",
      entityId: deletedExpenseId,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Expense deleted successfully.",
      data: null,
    });
  } catch (error) {
    console.error("Delete Expense Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to delete expense.",
      data: null,
    });
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};
