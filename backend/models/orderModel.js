const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Order = sequelize.define(
  "Order",
  {
    // Unique order ID
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Related crop ID
    cropId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    // Ordered quantity
    quantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },

    // Order date
    orderDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    // Order status
    status: {
      type: DataTypes.ENUM(
        "Pending",
        "Delivered",
        "Cancelled"
      ),
      defaultValue: "Pending",
    },
  },
  {
    tableName: "orders",
    timestamps: true,
  }
);

module.exports = Order;
