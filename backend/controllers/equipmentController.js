const { Equipment } = require("../models");
const logActivity = require("../utils/activityLogger");

// @desc    Get all equipment
// @route   GET /api/equipment
// @access  Admin, Manager
const getEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      succeeded: true,
      message: "Equipment fetched successfully",
      data: equipment,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// @desc    Get equipment by ID
// @route   GET /api/equipment/:id
// @access  Admin, Manager
const getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        succeeded: false,
        message: "Equipment not found",
        data: null,
      });
    }

    return res.status(200).json({
      succeeded: true,
      message: "Equipment fetched successfully",
      data: equipment,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// @desc    Create equipment
// @route   POST /api/equipment
// @access  Admin, Manager
const createEquipment = async (req, res) => {
  try {
    const {
      name,
      type,
      purchaseDate,
      status,
      lastServiceDate,
      serviceIntervalDays,
      notes,
    } = req.body;

    if (!name || !type || !purchaseDate) {
      return res.status(400).json({
        succeeded: false,
        message: "Name, type and purchase date are required",
        data: null,
      });
    }

    const validStatuses = ["Active", "Under Repair", "Idle"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        succeeded: false,
        message: "Invalid equipment status",
        data: null,
      });
    }

    if (
      serviceIntervalDays !== undefined &&
      (!Number.isInteger(Number(serviceIntervalDays)) ||
        Number(serviceIntervalDays) <= 0)
    ) {
      return res.status(400).json({
        succeeded: false,
        message: "Service interval must be a positive integer",
        data: null,
      });
    }

    const equipment = await Equipment.create({
      name: name.trim(),
      type: type.trim(),
      purchaseDate,
      status: status || "Active",
      lastServiceDate: lastServiceDate || null,
      serviceIntervalDays:
        serviceIntervalDays === undefined
          ? null
          : Number(serviceIntervalDays),
      notes: notes || null,
    });

    await logActivity({
      user: req.user.username,
      action: "add",
      entity: "Equipment",
      entityId: equipment.id,
    });

    return res.status(201).json({
      succeeded: true,
      message: "Equipment created successfully",
      data: equipment,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Admin only
const updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        succeeded: false,
        message: "Equipment not found",
        data: null,
      });
    }

    const allowedFields = [
      "name",
      "type",
      "purchaseDate",
      "status",
      "lastServiceDate",
      "serviceIntervalDays",
      "notes",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return res.status(400).json({
          succeeded: false,
          message: "Equipment name cannot be empty",
          data: null,
        });
      }

      updates.name = updates.name.trim();
    }

    if (updates.type !== undefined) {
      if (typeof updates.type !== "string" || !updates.type.trim()) {
        return res.status(400).json({
          succeeded: false,
          message: "Equipment type cannot be empty",
          data: null,
        });
      }

      updates.type = updates.type.trim();
    }

    if (
      updates.status !== undefined &&
      !["Active", "Under Repair", "Idle"].includes(updates.status)
    ) {
      return res.status(400).json({
        succeeded: false,
        message: "Invalid equipment status",
        data: null,
      });
    }

    if (updates.serviceIntervalDays !== undefined) {
      const interval = Number(updates.serviceIntervalDays);

      if (!Number.isInteger(interval) || interval <= 0) {
        return res.status(400).json({
          succeeded: false,
          message: "Service interval must be a positive integer",
          data: null,
        });
      }

      updates.serviceIntervalDays = interval;
    }

    await equipment.update(updates);

    await logActivity({
      user: req.user.username,
      action: "edit",
      entity: "Equipment",
      entityId: equipment.id,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Equipment updated successfully",
      data: equipment,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Admin only
const deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        succeeded: false,
        message: "Equipment not found",
        data: null,
      });
    }

    const deletedEquipmentId = equipment.id;

    await equipment.destroy();

    await logActivity({
      user: req.user.username,
      action: "delete",
      entity: "Equipment",
      entityId: deletedEquipmentId,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Equipment deleted successfully",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

module.exports = {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
};
