const express = require("express");
const router = express.Router();

const {
  getBuyers,
  getBuyerById,
  createBuyer,
  updateBuyer,
  deleteBuyer,
} = require("../controllers/buyerController");

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

// View buyers
router.get(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  getBuyers
);

// View single buyer
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "manager"),
  getBuyerById
);

// Add buyer
router.post(
  "/",
  protect,
  authorizeRoles("admin", "manager"),
  upload.single("photo"),
  createBuyer
);

// Edit buyer: Admin only
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  upload.single("photo"),
  updateBuyer
);

// Delete buyer: Admin only
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteBuyer
);

module.exports = router;
