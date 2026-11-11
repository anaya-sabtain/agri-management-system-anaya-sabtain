const { Maintenance, Equipment } = require("../models");
const logActivity = require("../utils/activityLogger");

// @desc    Get all maintenance records
// @route   GET /api/maintenance
// @access  Admin, Manager  
const getMaintenance = async (req, res) => {
  try {
    const records = await Maintenance.findAll({
      include: [
        {
          model: Equipment,
          as: "equipment",
        },
      ],
      order: [["date", "DESC"]],
    });

    return res.status(200).json({
      succeeded: true,
      message: "Maintenance records fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// @desc    Get maintenance by ID
// @route   GET /api/maintenance/:id
// @access  Admin, Manager
const getMaintenanceById = async (req, res) => {
  try {
    const record = await Maintenance.findByPk(req.params.id, {
      include: [
        {
          model: Equipment,
          as: "equipment",
        },
      ],
    });

    if (!record) {
      return res.status(404).json({
        succeeded: false,
        message: "Maintenance record not found",
        data: null,
      });
    }

    return res.status(200).json({
      succeeded: true,
      message: "Maintenance record fetched successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// @desc    Create maintenance record
// @route   POST /api/maintenance
// @access  Admin, Manager
const createMaintenance = async (req, res) => {
  try {
    const {
      equipmentId,
      date,
      description,
      cost,
      performedBy,
    } = req.body;

    if (
      !equipmentId ||
      !date ||
      !description ||
      cost === undefined ||
      !performedBy
    ) {
      return res.status(400).json({
        succeeded: false,
        message: "Please provide all required maintenance details",
        data: null,
      });
    }

    const maintenanceCost = Number(cost);

    if (!Number.isFinite(maintenanceCost) || maintenanceCost < 0) {
      return res.status(400).json({
        succeeded: false,
        message: "Maintenance cost must be a valid non-negative number",
        data: null,
      });
    }

    const equipment = await Equipment.findByPk(equipmentId);

    if (!equipment) {
      return res.status(404).json({
        succeeded: false,
        message: "Equipment not found",
        data: null,
      });
    }

    const record = await Maintenance.create({
      equipmentId,
      date,
      description: description.trim(),
      cost: maintenanceCost,
      performedBy: performedBy.trim(),
    });

    // Update equipment's last service date
    await equipment.update({
      lastServiceDate: date,
    });

    await logActivity({
      user: req.user.username,
      action: "add",
      entity: "Maintenance",
      entityId: record.id,
    });

    return res.status(201).json({
      succeeded: true,
      message: "Maintenance record created successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// @desc    Update maintenance record
// @route   PUT /api/maintenance/:id
// @access  Admin only
const updateMaintenance = async (req, res) => {
  try {
    const record = await Maintenance.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({
        succeeded: false,
        message: "Maintenance record not found",
        data: null,
      });
    }

    const {
      equipmentId,
      date,
      description,
      cost,
      performedBy,
    } = req.body;

    const updates = {};

    if (equipmentId !== undefined) {
      const equipment = await Equipment.findByPk(equipmentId);

      if (!equipment) {
        return res.status(404).json({
          succeeded: false,
          message: "Equipment not found",
          data: null,
        });
      }

      updates.equipmentId = equipmentId;
    }

    if (date !== undefined) {
      updates.date = date;
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
          succeeded: false,
          message: "Description cannot be empty",
          data: null,
        });
      }

      updates.description = description.trim();
    }

    if (cost !== undefined) {
      const maintenanceCost = Number(cost);

      if (!Number.isFinite(maintenanceCost) || maintenanceCost < 0) {
        return res.status(400).json({
          succeeded: false,
          message: "Maintenance cost must be a valid non-negative number",
          data: null,
        });
      }

      updates.cost = maintenanceCost;
    }

    if (performedBy !== undefined) {
      if (typeof performedBy !== "string" || !performedBy.trim()) {
        return res.status(400).json({
          succeeded: false,
          message: "Performed by cannot be empty",
          data: null,
        });
      }

      updates.performedBy = performedBy.trim();
    }

    await record.update(updates);

    await logActivity({
      user: req.user.username,
      action: "edit",
      entity: "Maintenance",
      entityId: record.id,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Maintenance record updated successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// @desc    Delete maintenance record
// @route   DELETE /api/maintenance/:id
// @access  Admin only
const deleteMaintenance = async (req, res) => {
  try {
    const record = await Maintenance.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({
        succeeded: false,
        message: "Maintenance record not found",
        data: null,
      });
    }

    const deletedMaintenanceId = record.id;

    await record.destroy();

    await logActivity({
      user: req.user.username,
      action: "delete",
      entity: "Maintenance",
      entityId: deletedMaintenanceId,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Maintenance record deleted successfully",
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
  getMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
};
