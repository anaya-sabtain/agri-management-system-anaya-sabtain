const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const sequelize = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const cropRoutes = require("./routes/cropRoutes");
const orderRoutes = require("./routes/orderRoutes");
const buyerRoutes = require("./routes/buyerRoutes");
const taskRoutes = require("./routes/taskRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const workerRoutes = require("./routes/workerRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const activityRoutes = require("./routes/activityRoutes");

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// Allow frontend requests
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
  })
);

// Read JSON request bodies
app.use(express.json({ limit: "2mb" }));

// Log incoming requests
app.use(morgan("dev"));

// Static folder for uploaded buyer photos
app.use("/Images", express.static("public/Images"));

// Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/buyers", buyerRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/activities", activityRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    succeeded: true,
    message: "Agriculture API is running",
  });
});

// Start server only after database connection
const PORT = process.env.PORT_NAME || 5000;
let server;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("PostgreSQL connected successfully");

    server = app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

    // Keep the event loop alive indefinitely
    setInterval(() => {}, 1000 * 60 * 60);
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
