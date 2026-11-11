const { Task, Crop } = require("../models");
const logActivity = require("../utils/activityLogger");

// GET ALL TASKS
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: [
        {
          model: Crop,
          as: "crop",
          attributes: ["id", "name", "field"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      succeeded: true,
      message: "Tasks fetched successfully.",
      data: tasks,
    });
  } catch (error) {
    console.error("Get Tasks Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to fetch tasks.",
      data: null,
    });
  }
};

// GET SINGLE TASK
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: Crop,
          as: "crop",
          attributes: ["id", "name", "field"],
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        succeeded: false,
        message: "Task not found.",
        data: null,
      });
    }

    return res.status(200).json({
      succeeded: true,
      message: "Task fetched successfully.",
      data: task,
    });
  } catch (error) {
    console.error("Get Task Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to fetch task.",
      data: null,
    });
  }
};

// CREATE TASK
const createTask = async (req, res) => {
  try {
    const { title, type, cropId, dueDate, status } = req.body;

    if (!title || !type || !dueDate) {
      return res.status(400).json({
        succeeded: false,
        message: "Title, type and due date are required.",
        data: null,
      });
    }

    const allowedTypes = [
      "Irrigation",
      "Fertilizer",
      "Spraying",
      "Labour",
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        succeeded: false,
        message: "Invalid task type.",
        data: null,
      });
    }

    if (cropId) {
      const crop = await Crop.findByPk(cropId);

      if (!crop) {
        return res.status(404).json({
          succeeded: false,
          message: "Selected crop does not exist.",
          data: null,
        });
      }
    }

    const task = await Task.create({
      title,
      type,
      cropId: cropId || null,
      dueDate,
      status: status || "Pending",
    });

    await logActivity({
      user: req.user.username,
      action: "add",
      entity: "Task",
      entityId: task.id,
    });

    return res.status(201).json({
      succeeded: true,
      message: "Task created successfully.",
      data: task,
    });
  } catch (error) {
    console.error("Create Task Error:", error.message);

    return res.status(400).json({
      succeeded: false,
      message: "Failed to create task. Please check your input.",
      data: null,
    });
  }
};

// UPDATE TASK
const updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        succeeded: false,
        message: "Task not found.",
        data: null,
      });
    }

    const allowedFields = [
      "title",
      "type",
      "cropId",
      "dueDate",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.cropId) {
      const crop = await Crop.findByPk(updates.cropId);

      if (!crop) {
        return res.status(404).json({
          succeeded: false,
          message: "Selected crop does not exist.",
          data: null,
        });
      }
    }

    await task.update(updates);

    await logActivity({
      user: req.user.username,
      action: "edit",
      entity: "Task",
      entityId: task.id,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Task updated successfully.",
      data: task,
    });
  } catch (error) {
    console.error("Update Task Error:", error.message);

    return res.status(400).json({
      succeeded: false,
      message: "Failed to update task.",
      data: null,
    });
  }
};

// DELETE TASK
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        succeeded: false,
        message: "Task not found.",
        data: null,
      });
    }

    const deletedTaskId = task.id;

    await task.destroy();

    await logActivity({
      user: req.user.username,
      action: "delete",
      entity: "Task",
      entityId: deletedTaskId,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Task deleted successfully.",
      data: null,
    });
  } catch (error) {
    console.error("Delete Task Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to delete task.",
      data: null,
    });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
