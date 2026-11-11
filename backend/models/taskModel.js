const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Task = sequelize.define(
  "Task",
  {
    // Unique task ID
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Task title
    title: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    // Task category
    type: {
      type: DataTypes.ENUM(
        "Irrigation",
        "Fertilizer",
        "Spraying",
        "Labour"
      ),
      allowNull: false,
    },

    // Related crop ID (optional)
    cropId: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    // Task deadline
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    // Task completion status
    status: {
      type: DataTypes.ENUM(
        "Pending",
        "Done",
        "Overdue"
      ),
      defaultValue: "Pending",
    },
  },
  {
    tableName: "tasks",
    timestamps: true,
  }
);

module.exports = Task;
