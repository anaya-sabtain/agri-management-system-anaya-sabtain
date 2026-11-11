const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Inventory = sequelize.define(
  "Inventory",
  {
    // Unique inventory ID
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Inventory item name
    item: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    // Inventory category
    type: {
      type: DataTypes.ENUM(
        "Fertilizer",
        "Pesticide",
        "Seed"
      ),
      allowNull: false,
    },

    // Available quantity
    qty: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // Minimum stock threshold
    minQty: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // Measurement unit
    unit: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
  },
  {
    tableName: "inventory",
    timestamps: true,
  }
);

module.exports = Inventory;
