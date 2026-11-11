const { Inventory } = require("../models");
const logActivity = require("../utils/activityLogger");

// GET ALL INVENTORY
const getInventory = async (req, res) => {
  try {
    const items = await Inventory.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      succeeded: true,
      message: "Inventory fetched successfully.",
      data: items,
    });
  } catch (error) {
    console.error("Get Inventory Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to fetch inventory.",
      data: null,
    });
  }
};

// GET SINGLE INVENTORY ITEM
const getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({
        succeeded: false,
        message: "Inventory item not found.",
        data: null,
      });
    }

    return res.status(200).json({
      succeeded: true,
      message: "Inventory item fetched successfully.",
      data: item,
    });
  } catch (error) {
    console.error("Get Inventory Item Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to fetch inventory item.",
      data: null,
    });
  }
};

// CREATE INVENTORY ITEM
const createInventory = async (req, res) => {
  try {
    const { item, type, qty, minQty, unit } = req.body;

    if (!item || !type || qty === undefined || !unit) {
      return res.status(400).json({
        succeeded: false,
        message: "Item, type, quantity and unit are required.",
        data: null,
      });
    }

    const allowedTypes = ["Fertilizer", "Pesticide", "Seed"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        succeeded: false,
        message: "Invalid inventory type.",
        data: null,
      });
    }

    const numericQty = Number(qty);
    const numericMinQty = Number(minQty ?? 0);

    if (!Number.isFinite(numericQty) || numericQty < 0) {
      return res.status(400).json({
        succeeded: false,
        message: "Quantity cannot be negative.",
        data: null,
      });
    }

    if (!Number.isFinite(numericMinQty) || numericMinQty < 0) {
      return res.status(400).json({
        succeeded: false,
        message: "Minimum quantity cannot be negative.",
        data: null,
      });
    }

    const inventory = await Inventory.create({
      item,
      type,
      qty: numericQty,
      minQty: numericMinQty,
      unit,
    });

    await logActivity({
      user: req.user.username,
      action: "add",
      entity: "Inventory",
      entityId: inventory.id,
    });

    return res.status(201).json({
      succeeded: true,
      message: "Inventory item created successfully.",
      data: inventory,
    });
  } catch (error) {
    console.error("Create Inventory Error:", error.message);

    return res.status(400).json({
      succeeded: false,
      message: "Failed to create inventory item.",
      data: null,
    });
  }
};

// UPDATE INVENTORY ITEM
const updateInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        succeeded: false,
        message: "Inventory item not found.",
        data: null,
      });
    }

    const allowedFields = ["item", "type", "qty", "minQty", "unit"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.type !== undefined) {
      const allowedTypes = ["Fertilizer", "Pesticide", "Seed"];

      if (!allowedTypes.includes(updates.type)) {
        return res.status(400).json({
          succeeded: false,
          message: "Invalid inventory type.",
          data: null,
        });
      }
    }

    for (const field of ["qty", "minQty"]) {
      if (updates[field] !== undefined) {
        const value = Number(updates[field]);

        if (!Number.isFinite(value) || value < 0) {
          return res.status(400).json({
            succeeded: false,
            message: `${field} cannot be negative.`,
            data: null,
          });
        }

        updates[field] = value;
      }
    }

    await inventory.update(updates);

    await logActivity({
      user: req.user.username,
      action: "edit",
      entity: "Inventory",
      entityId: inventory.id,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Inventory updated successfully.",
      data: inventory,
    });
  } catch (error) {
    console.error("Update Inventory Error:", error.message);

    return res.status(400).json({
      succeeded: false,
      message: "Failed to update inventory.",
      data: null,
    });
  }
};

// DELETE INVENTORY ITEM
const deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        succeeded: false,
        message: "Inventory item not found.",
        data: null,
      });
    }

    const deletedInventoryId = inventory.id;

    await inventory.destroy();

    await logActivity({
      user: req.user.username,
      action: "delete",
      entity: "Inventory",
      entityId: deletedInventoryId,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Inventory item deleted successfully.",
      data: null,
    });
  } catch (error) {
    console.error("Delete Inventory Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to delete inventory item.",
      data: null,
    });
  }
};

// GET LOW STOCK ITEMS
const getLowStockItems = async (req, res) => {
  try {
    const items = await Inventory.findAll({
      where: {
        qty: {
          [require("sequelize").Op.lte]: require("sequelize").col("minQty"),
        },
      },
      order: [["qty", "ASC"]],
    });

    return res.status(200).json({
      succeeded: true,
      message: "Low stock items fetched successfully.",
      data: items,
    });
  } catch (error) {
    console.error("Low Stock Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to fetch low stock items.",
      data: null,
    });
  }
};

module.exports = {
  getInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getLowStockItems,
};
