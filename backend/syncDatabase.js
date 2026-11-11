const sequelize = require("./config/db");

// Import all models and configure associations
require("./models");

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");

    // Create tables that do not already exist
    await sequelize.sync();

    console.log("All database tables created successfully.");
  } catch (error) {
    console.error("Database synchronization failed:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

syncDatabase();
