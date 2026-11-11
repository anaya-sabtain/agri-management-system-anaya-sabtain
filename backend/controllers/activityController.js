const { Activity } = require("../models");

// @desc    Get all activity logs
// @route   GET /api/activities
// @access  Admin, Manager
const getActivities = async (req, res) => {
  try {
    const activities = await Activity.findAll({
      order: [["timestamp", "DESC"]],
    });

    return res.status(200).json({
      succeeded: true,
      message: "Activity logs fetched successfully",
      data: activities,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// @desc    Get single activity log
// @route   GET /api/activities/:id
// @access  Admin, Manager
const getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);

    if (!activity) {
      return res.status(404).json({
        succeeded: false,
        message: "Activity log not found",
        data: null,
      });
    }

    return res.status(200).json({
      succeeded: true,
      message: "Activity log fetched successfully",
      data: activity,
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
  getActivities,
  getActivityById,
};
