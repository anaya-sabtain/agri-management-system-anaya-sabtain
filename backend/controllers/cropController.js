const { Crop } = require("../models");
const logActivity = require("../utils/activityLogger");

// GET ALL CROPS
const getCrops = async (req, res) => {
  try {
    const crops = await Crop.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      succeeded: true,
      message: "Crops fetched successfully.",
      data: crops,
    });
  } catch (error) {
    console.error("Get Crops Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to fetch crops.",
      data: null,
    });
  }
};

// GET SINGLE CROP
const getCropById = async (req, res) => {
  try {
    const crop = await Crop.findByPk(req.params.id);

    if (!crop) {
      return res.status(404).json({
        succeeded: false,
        message: "Crop not found.",
        data: null,
      });
    }

    return res.status(200).json({
      succeeded: true,
      message: "Crop fetched successfully.",
      data: crop,
    });
  } catch (error) {
    console.error("Get Crop Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to fetch crop.",
      data: null,
    });
  }
};

// CREATE CROP
const createCrop = async (req, res) => {
  try {
    const {
      name,
      field,
      plantingDate,
      cuttingDate,
      healthScore,
      status,
      expectedQty,
      harvestQty,
    } = req.body;

    if (!name || !field || !cuttingDate) {
      return res.status(400).json({
        succeeded: false,
        message: "Name, field and cutting date are required.",
        data: null,
      });
    }

    const crop = await Crop.create({
      name,
      field,
      plantingDate,
      cuttingDate,
      healthScore,
      status,
      expectedQty,
      harvestQty,
      createdBy: req.user.id,
    });

    await logActivity({
      user: req.user.username,
      action: "add",
      entity: "Crop",
      entityId: crop.id,
    });

    return res.status(201).json({
      succeeded: true,
      message: "Crop created successfully.",
      data: crop,
    });
  } catch (error) {
    console.error("Create Crop Error:", error.message);

    return res.status(400).json({
      succeeded: false,
      message: "Failed to create crop. Please check your input.",
      data: null,
    });
  }
};

// UPDATE CROP
const updateCrop = async (req, res) => {
  try {
    const crop = await Crop.findByPk(req.params.id);

    if (!crop) {
      return res.status(404).json({
        succeeded: false,
        message: "Crop not found.",
        data: null,
      });
    }

    const allowedFields = [
      "name",
      "field",
      "plantingDate",
      "cuttingDate",
      "healthScore",
      "status",
      "expectedQty",
      "harvestQty",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    await crop.update(updates);

    await logActivity({
      user: req.user.username,
      action: "edit",
      entity: "Crop",
      entityId: crop.id,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Crop updated successfully.",
      data: crop,
    });
  } catch (error) {
    console.error("Update Crop Error:", error.message);

    return res.status(400).json({
      succeeded: false,
      message: "Failed to update crop. Please check your input.",
      data: null,
    });
  }
};

// DELETE CROP
const deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findByPk(req.params.id);

    if (!crop) {
      return res.status(404).json({
        succeeded: false,
        message: "Crop not found.",
        data: null,
      });
    }

    const deletedCropId = crop.id;

    await crop.destroy();

    await logActivity({
      user: req.user.username,
      action: "delete",
      entity: "Crop",
      entityId: deletedCropId,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Crop deleted successfully.",
      data: null,
    });
  } catch (error) {
    console.error("Delete Crop Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to delete crop.",
      data: null,
    });
  }
};

module.exports = {
  getCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop,
};
