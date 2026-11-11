const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Expense = sequelize.define(
  "Expense",
  {
    // Unique expense ID
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Related crop ID (optional)
    cropId: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    // Expense category
    category: {
      type: DataTypes.ENUM(
        "Seeds",
        "Fertilizer",
        "Labour",
        "Fuel",
        "Repair",
        "Other"
      ),
      allowNull: false,
    },

    // Expense amount
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },

    // Expense date
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    // Additional details
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "expenses",
    timestamps: true,
  }
);

module.exports = Expense;
