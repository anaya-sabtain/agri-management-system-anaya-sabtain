const { Attendance, Worker } = require("../models");
const logActivity = require("../utils/activityLogger");

const VALID_STATUSES = ["Present", "Absent", "Half-day", "Leave"];

// Validate YYYY-MM-DD dates
const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Admin, Manager
const getAttendance = async (req, res) => {
  try {
    const records = await Attendance.findAll({
      include: [
        {
          model: Worker,
          as: "worker",
          attributes: ["id", "fullName", "cnic", "role"],
        },
      ],
      order: [["date", "DESC"]],
    });

    return res.status(200).json({
      succeeded: true,
      message: "Attendance records fetched successfully",
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

// @desc    Get attendance by ID
// @route   GET /api/attendance/:id
// @access  Admin, Manager
const getAttendanceById = async (req, res) => {
  try {
    const record = await Attendance.findByPk(req.params.id, {
      include: [
        {
          model: Worker,
          as: "worker",
          attributes: ["id", "fullName", "cnic", "role"],
        },
      ],
    });

    if (!record) {
      return res.status(404).json({
        succeeded: false,
        message: "Attendance record not found",
        data: null,
      });
    }

    return res.status(200).json({
      succeeded: true,
      message: "Attendance record fetched successfully",
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

// @desc    Create attendance record
// @route   POST /api/attendance
// @access  Admin, Manager
const createAttendance = async (req, res) => {
  try {
    const { workerId, date, status, note } = req.body;

    if (!workerId || !date || !status) {
      return res.status(400).json({
        succeeded: false,
        message: "Worker ID, date and status are required",
        data: null,
      });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({
        succeeded: false,
        message: "Date must be a valid YYYY-MM-DD date",
        data: null,
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        succeeded: false,
        message: "Invalid attendance status",
        data: null,
      });
    }

    const worker = await Worker.findByPk(workerId);

    if (!worker) {
      return res.status(404).json({
        succeeded: false,
        message: "Worker not found",
        data: null,
      });
    }

    const existingRecord = await Attendance.findOne({
      where: { workerId, date },
    });

    if (existingRecord) {
      return res.status(409).json({
        succeeded: false,
        message: "Attendance already exists for this worker on this date",
        data: null,
      });
    }

    const record = await Attendance.create({
      workerId,
      date,
      status,
      note: note || null,
    });

    await logActivity({
      user: req.user.username,
      action: "add",
      entity: "Attendance",
      entityId: record.id,
    });

    return res.status(201).json({
      succeeded: true,
      message: "Attendance created successfully",
      data: record,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        succeeded: false,
        message: "Attendance already exists for this worker on this date",
        data: null,
      });
    }

    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Admin only
const updateAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({
        succeeded: false,
        message: "Attendance record not found",
        data: null,
      });
    }

    const { workerId, date, status, note } = req.body;

    const updates = {};

    if (workerId !== undefined) {
      updates.workerId = workerId;
    }

    if (date !== undefined) {
      updates.date = date;
    }

    if (status !== undefined) {
      updates.status = status;
    }

    if (note !== undefined) {
      updates.note = note;
    }

    if (updates.date !== undefined && !isValidDate(updates.date)) {
      return res.status(400).json({
        succeeded: false,
        message: "Date must be a valid YYYY-MM-DD date",
        data: null,
      });
    }

    if (
      updates.status !== undefined &&
      !VALID_STATUSES.includes(updates.status)
    ) {
      return res.status(400).json({
        succeeded: false,
        message: "Invalid attendance status",
        data: null,
      });
    }

    if (updates.workerId !== undefined) {
      const worker = await Worker.findByPk(updates.workerId);

      if (!worker) {
        return res.status(404).json({
          succeeded: false,
          message: "Worker not found",
          data: null,
        });
      }
    }

    const finalWorkerId = updates.workerId ?? record.workerId;
    const finalDate = updates.date ?? record.date;

    const duplicateRecord = await Attendance.findOne({
      where: {
        workerId: finalWorkerId,
        date: finalDate,
      },
    });

    if (duplicateRecord && duplicateRecord.id !== record.id) {
      return res.status(409).json({
        succeeded: false,
        message: "Attendance already exists for this worker on this date",
        data: null,
      });
    }

    await record.update(updates);

    await logActivity({
      user: req.user.username,
      action: "edit",
      entity: "Attendance",
      entityId: record.id,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Attendance updated successfully",
      data: record,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        succeeded: false,
        message: "Attendance already exists for this worker on this date",
        data: null,
      });
    }

    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Admin only
const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({
        succeeded: false,
        message: "Attendance record not found",
        data: null,
      });
    }

    const deletedAttendanceId = record.id;

    await record.destroy();

    await logActivity({
      user: req.user.username,
      action: "delete",
      entity: "Attendance",
      entityId: deletedAttendanceId,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Attendance deleted successfully",
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
  getAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
};
