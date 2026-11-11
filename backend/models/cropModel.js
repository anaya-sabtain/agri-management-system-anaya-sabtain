const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Crop = sequelize.define(
  "Crop",
  {
    // Unique crop ID
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Crop name
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },

    // Field where crop is planted
    field: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },

    // Planting date
    plantingDate: {
      type: DataTypes.DATEONLY,
    },

    // Expected cutting date
    cuttingDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    // Crop health percentage
    healthScore: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      validate: {
        min: 0,
        max: 100,
      },
    },

    // Crop condition
    status: {
      type: DataTypes.ENUM(
        "Healthy",
        "Needs Attention",
        "Critical"
      ),
      defaultValue: "Healthy",
    },

    // Expected harvest quantity
    expectedQty: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    // Actual harvested quantity
    harvestQty: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    // User who created the crop
    createdBy: {
      type: DataTypes.UUID,
    },
  },
  {
    tableName: "crops",
    timestamps: true,
  }
);

module.exports = Crop;
