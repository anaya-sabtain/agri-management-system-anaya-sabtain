const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Maintenance = sequelize.define(
  "Maintenance",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    equipmentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    cost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    performedBy: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: "maintenance",
    timestamps: true,
  }
);

module.exports = Maintenance;
