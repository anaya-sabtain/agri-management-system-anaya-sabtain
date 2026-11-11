const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Attendance = sequelize.define(
  "Attendance",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    workerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "Present",
        "Absent",
        "Half-day",
        "Leave"
      ),
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "attendance",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["workerId", "date"],
      },
    ],
  }
);

module.exports = Attendance;
