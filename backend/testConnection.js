const sequelize = require("./config/db");

(async () => {
  try {
    await sequelize.authenticate();

    console.log("PostgreSQL connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error.original?.message || error.message || error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
