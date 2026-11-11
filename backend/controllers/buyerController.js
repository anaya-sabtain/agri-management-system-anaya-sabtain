const { Buyer, Crop, sequelize } = require("../models");
const { Op } = require("sequelize");
const logActivity = require("../utils/activityLogger");

// GET ALL BUYERS
const getBuyers = async (req, res) => {
  try {
    const buyers = await Buyer.findAll({
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
      message: "Buyers fetched successfully.",
      data: buyers,
    });
  } catch (error) {
    console.error("Get Buyers Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to fetch buyers.",
      data: null,
    });
  }
};

// GET SINGLE BUYER
const getBuyerById = async (req, res) => {
  try {
    const buyer = await Buyer.findByPk(req.params.id, {
      include: [
        {
          model: Crop,
          as: "crop",
          attributes: ["id", "name", "field"],
        },
      ],
    });

    if (!buyer) {
      return res.status(404).json({
        succeeded: false,
        message: "Buyer not found.",
        data: null,
      });
    }

    return res.status(200).json({
      succeeded: true,
      message: "Buyer fetched successfully.",
      data: buyer,
    });
  } catch (error) {
    console.error("Get Buyer Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to fetch buyer.",
      data: null,
    });
  }
};

// CREATE BUYER
const createBuyer = async (req, res) => {
  try {
    const { name, cnic, cropId, quantity, date } = req.body;

    if (!name || !cnic || !cropId || !quantity || !date) {
      return res.status(400).json({
        succeeded: false,
        message: "Please provide all required buyer details.",
        data: null,
      });
    }

    if (!/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
      return res.status(400).json({
        succeeded: false,
        message: "Invalid CNIC format. Use 12345-1234567-1.",
        data: null,
      });
    }

    const requestedQuantity = Number(quantity);

    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      return res.status(400).json({
        succeeded: false,
        message: "Quantity must be greater than zero.",
        data: null,
      });
    }

    const crop = await Crop.findByPk(cropId);

    if (!crop) {
      return res.status(404).json({
        succeeded: false,
        message: "Selected crop does not exist.",
        data: null,
      });
    }

    // Calculate quantity already sold to other buyers
    const soldQuantity = Number(
      (await Buyer.sum("quantity", {
        where: { cropId },
      })) || 0
    );

    const availableQuantity =
      Number(crop.harvestQty) - soldQuantity;

    if (requestedQuantity > availableQuantity) {
      return res.status(400).json({
        succeeded: false,
        message: `Insufficient crop stock. Available quantity: ${availableQuantity}.`,
        data: null,
      });
    }

    const buyer = await Buyer.create({
      name,
      cnic,
      cropId,
      quantity: requestedQuantity,
      date,
      photoUrl: req.file ? `/Images/${req.file.filename}` : null,
    });

    await logActivity({
      user: req.user.username,
      action: "add",
      entity: "Buyer",
      entityId: buyer.id,
    });

    return res.status(201).json({
      succeeded: true,
      message: "Buyer created successfully.",
      data: buyer,
    });
  } catch (error) {
    console.error("Create Buyer Error:", error.message);

    return res.status(400).json({
      succeeded: false,
      message: "Failed to create buyer. Check CNIC and input details.",
      data: null,
    });
  }
};

// UPDATE BUYER
const updateBuyer = async (req, res) => {
  try {
    const buyer = await Buyer.findByPk(req.params.id);

    if (!buyer) {
      return res.status(404).json({
        succeeded: false,
        message: "Buyer not found.",
        data: null,
      });
    }

    const {
      name,
      cnic,
      cropId,
      quantity,
      date,
    } = req.body;

    const targetCropId = cropId || buyer.cropId;
    const requestedQuantity =
      quantity !== undefined ? Number(quantity) : Number(buyer.quantity);

    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      return res.status(400).json({
        succeeded: false,
        message: "Quantity must be greater than zero.",
        data: null,
      });
    }

    if (cnic && !/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
      return res.status(400).json({
        succeeded: false,
        message: "Invalid CNIC format.",
        data: null,
      });
    }

    const crop = await Crop.findByPk(targetCropId);

    if (!crop) {
      return res.status(404).json({
        succeeded: false,
        message: "Selected crop does not exist.",
        data: null,
      });
    }

    // Exclude the current buyer from sold quantity
    const soldQuantity = Number(
      (await Buyer.sum("quantity", {
        where: {
          cropId: targetCropId,
          id: { [Op.ne]: buyer.id },
        },
      })) || 0
    );

    const availableQuantity =
      Number(crop.harvestQty) - soldQuantity;

    if (requestedQuantity > availableQuantity) {
      return res.status(400).json({
        succeeded: false,
        message: `Insufficient crop stock. Available quantity: ${availableQuantity}.`,
        data: null,
      });
    }

    await buyer.update({
      name: name ?? buyer.name,
      cnic: cnic ?? buyer.cnic,
      cropId: targetCropId,
      quantity: requestedQuantity,
      date: date ?? buyer.date,
      photoUrl: req.file
        ? `/Images/${req.file.filename}`
        : buyer.photoUrl,
    });

    await logActivity({
      user: req.user.username,
      action: "edit",
      entity: "Buyer",
      entityId: buyer.id,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Buyer updated successfully.",
      data: buyer,
    });
  } catch (error) {
    console.error("Update Buyer Error:", error.message);

    return res.status(400).json({
      succeeded: false,
      message: "Failed to update buyer. Check CNIC and input details.",
      data: null,
    });
  }
};

// DELETE BUYER
const deleteBuyer = async (req, res) => {
  try {
    const buyer = await Buyer.findByPk(req.params.id);

    if (!buyer) {
      return res.status(404).json({
        succeeded: false,
        message: "Buyer not found.",
        data: null,
      });
    }

    const deletedBuyerId = buyer.id;

    await buyer.destroy();

    await logActivity({
      user: req.user.username,
      action: "delete",
      entity: "Buyer",
      entityId: deletedBuyerId,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Buyer deleted successfully.",
      data: null,
    });
  } catch (error) {
    console.error("Delete Buyer Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to delete buyer.",
      data: null,
    });
  }
};

module.exports = {
  getBuyers,
  getBuyerById,
  createBuyer,
  updateBuyer,
  deleteBuyer,
};
