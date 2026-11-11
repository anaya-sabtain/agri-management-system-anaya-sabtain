const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Worker = sequelize.define(
  "Worker",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    cnic: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
      validate: {
        is: /^\d{5}-\d{7}-\d{1}$/,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    dailyWage: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    joinDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      defaultValue: "Active",
    },
  },
  {
    tableName: "workers",
    timestamps: true,
  }
);

module.exports = Worker;
