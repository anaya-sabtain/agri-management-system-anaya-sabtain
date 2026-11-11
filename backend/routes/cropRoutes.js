const express = require("express");
const router = express.Router();

const {
  getCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop,
} = require("../controllers/cropController");

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// View crops: Admin + Manager
router.get("/", protect, authorizeRoles("admin", "manager"), getCrops);

// View single crop: Admin + Manager
router.get("/:id", protect, authorizeRoles("admin", "manager"), getCropById);

// Add crop: Admin + Manager
router.post("/", protect, authorizeRoles("admin", "manager"), createCrop);

// Edit crop: Admin only
router.put("/:id", protect, authorizeRoles("admin"), updateCrop);

// Delete crop: Admin only
router.delete("/:id", protect, authorizeRoles("admin"), deleteCrop);

module.exports = router;
