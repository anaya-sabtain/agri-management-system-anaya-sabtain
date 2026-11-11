const { Worker } = require("../models");
const logActivity = require("../utils/activityLogger");

// @desc    Get all workers
// @route   GET /api/workers
// @access  Admin, Manager
const getWorkers = async (req, res) => {
  try {
    const workers = await Worker.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      succeeded: true,
      message: "Workers fetched successfully",
      data: workers,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// @desc    Get single worker
// @route   GET /api/workers/:id
// @access  Admin, Manager
const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.params.id);

    if (!worker) {
      return res.status(404).json({
        succeeded: false,
        message: "Worker not found",
        data: null,
      });
    }

    return res.status(200).json({
      succeeded: true,
      message: "Worker fetched successfully",
      data: worker,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// @desc    Create worker
// @route   POST /api/workers
// @access  Admin, Manager
const createWorker = async (req, res) => {
  try {
    const {
      fullName,
      cnic,
      phone,
      role,
      dailyWage,
      joinDate,
      status,
    } = req.body;

    if (!fullName || !cnic || !phone || !role ||
        dailyWage === undefined || !joinDate) {
      return res.status(400).json({
        succeeded: false,
        message: "Please provide all required worker details",
        data: null,
      });
    }

    const formattedCnic = cnic.trim();

    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;

    if (!cnicRegex.test(formattedCnic)) {
      return res.status(400).json({
        succeeded: false,
        message: "CNIC must be in 12345-1234567-1 format",
        data: null,
      });
    }

    if (Number(dailyWage) <= 0 || !Number.isFinite(Number(dailyWage))) {
      return res.status(400).json({
        succeeded: false,
        message: "Daily wage must be a positive number",
        data: null,
      });
    }

    const validStatuses = ["Active", "Inactive"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        succeeded: false,
        message: "Invalid worker status",
        data: null,
      });
    }

    const existingWorker = await Worker.findOne({
      where: { cnic: formattedCnic },
    });

    if (existingWorker) {
      return res.status(409).json({
        succeeded: false,
        message: "Worker with this CNIC already exists",
        data: null,
      });
    }

    const worker = await Worker.create({
      fullName: fullName.trim(),
      cnic: formattedCnic,
      phone: phone.trim(),
      role: role.trim(),
      dailyWage: Number(dailyWage),
      joinDate,
      status: status || "Active",
    });

    await logActivity({
      user: req.user.username,
      action: "add",
      entity: "Worker",
      entityId: worker.id,
    });

    return res.status(201).json({
      succeeded: true,
      message: "Worker created successfully",
      data: worker,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// @desc    Update worker
// @route   PUT /api/workers/:id
// @access  Admin only
const updateWorker = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.params.id);

    if (!worker) {
      return res.status(404).json({
        succeeded: false,
        message: "Worker not found",
        data: null,
      });
    }

    const allowedFields = [
      "fullName",
      "cnic",
      "phone",
      "role",
      "dailyWage",
      "joinDate",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.cnic !== undefined) {
      updates.cnic = String(updates.cnic).trim();

      if (!/^\d{5}-\d{7}-\d{1}$/.test(updates.cnic)) {
        return res.status(400).json({
          succeeded: false,
          message: "Invalid CNIC format",
          data: null,
        });
      }

      const duplicateCnic = await Worker.findOne({
        where: { cnic: updates.cnic },
      });

      if (duplicateCnic && duplicateCnic.id !== worker.id) {
        return res.status(409).json({
          succeeded: false,
          message: "Another worker already uses this CNIC",
          data: null,
        });
      }
    }

    if (updates.dailyWage !== undefined) {
      const wage = Number(updates.dailyWage);

      if (!Number.isFinite(wage) || wage <= 0) {
        return res.status(400).json({
          succeeded: false,
          message: "Daily wage must be a positive number",
          data: null,
        });
      }

      updates.dailyWage = wage;
    }

    if (
      updates.status !== undefined &&
      !["Active", "Inactive"].includes(updates.status)
    ) {
      return res.status(400).json({
        succeeded: false,
        message: "Invalid worker status",
        data: null,
      });
    }

    if (updates.fullName !== undefined) {
      updates.fullName = String(updates.fullName).trim();
    }

    if (updates.phone !== undefined) {
      updates.phone = String(updates.phone).trim();
    }

    if (updates.role !== undefined) {
      updates.role = String(updates.role).trim();
    }

    await worker.update(updates);

    await logActivity({
      user: req.user.username,
      action: "edit",
      entity: "Worker",
      entityId: worker.id,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Worker updated successfully",
      data: worker,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// @desc    Delete worker
// @route   DELETE /api/workers/:id
// @access  Admin only
const deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.params.id);

    if (!worker) {
      return res.status(404).json({
        succeeded: false,
        message: "Worker not found",
        data: null,
      });
    }

    const deletedWorkerId = worker.id;

    await worker.destroy();

    await logActivity({
      user: req.user.username,
      action: "delete",
      entity: "Worker",
      entityId: deletedWorkerId,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Worker deleted successfully",
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
  getWorkers,
  getWorkerById,
  createWorker,
  updateWorker,
  deleteWorker,
};
