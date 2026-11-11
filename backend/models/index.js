const User = require("./userModel");
const Crop = require("./cropModel");
const Order = require("./orderModel");
const Buyer = require("./buyerModel");
const Task = require("./taskModel");
const Expense = require("./expenseModel");
const Inventory = require("./inventoryModel");
const Worker = require("./workerModel");
const Attendance = require("./attendanceModel");
const Equipment = require("./equipmentModel");
const Maintenance = require("./maintenanceModel");
const Activity = require("./activityModel");
const sequelize = require("../config/db");

// User - Crop
User.hasMany(Crop, {
  foreignKey: "createdBy",
  as: "createdCrops",
});

Crop.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

// Crop - Order
Crop.hasMany(Order, {
  foreignKey: "cropId",
  as: "orders",
});

Order.belongsTo(Crop, {
  foreignKey: "cropId",
  as: "crop",
});

// Crop - Buyer
Crop.hasMany(Buyer, {
  foreignKey: "cropId",
  as: "buyers",
});

Buyer.belongsTo(Crop, {
  foreignKey: "cropId",
  as: "crop",
});

// Crop - Task
Crop.hasMany(Task, {
  foreignKey: "cropId",
  as: "tasks",
});

Task.belongsTo(Crop, {
  foreignKey: "cropId",
  as: "crop",
});

// Crop - Expense
Crop.hasMany(Expense, {
  foreignKey: "cropId",
  as: "expenses",
});

Expense.belongsTo(Crop, {
  foreignKey: "cropId",
  as: "crop",
});

// Worker - Attendance
Worker.hasMany(Attendance, {
  foreignKey: "workerId",
  as: "attendanceRecords",
});

Attendance.belongsTo(Worker, {
  foreignKey: "workerId",
  as: "worker",
});

// Equipment - Maintenance
Equipment.hasMany(Maintenance, {
  foreignKey: "equipmentId",
  as: "maintenanceRecords",
});

Maintenance.belongsTo(Equipment, {
  foreignKey: "equipmentId",
  as: "equipment",
});

module.exports = {
  User,
  Crop,
  Order,
  Buyer,
  Task,
  Expense,
  Inventory,
  Worker,
  Attendance,
  Equipment,
  Maintenance,
  Activity,
  sequelize,
};
