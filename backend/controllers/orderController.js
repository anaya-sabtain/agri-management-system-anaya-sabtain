const { Order, Crop } = require("../models");
const logActivity = require("../utils/activityLogger");

// GET ALL ORDERS
const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
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
      message: "Orders fetched successfully.",
      data: orders,
    });
  } catch (error) {
    console.error("Get Orders Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to fetch orders.",
      data: null,
    });
  }
};

// GET SINGLE ORDER
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: Crop,
          as: "crop",
          attributes: ["id", "name", "field"],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        succeeded: false,
        message: "Order not found.",
        data: null,
      });
    }

    return res.status(200).json({
      succeeded: true,
      message: "Order fetched successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Get Order Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to fetch order.",
      data: null,
    });
  }
};

// CREATE ORDER
const createOrder = async (req, res) => {
  try {
    const { cropId, quantity, orderDate, status } = req.body;

    if (!cropId || !quantity || !orderDate) {
      return res.status(400).json({
        succeeded: false,
        message: "Crop ID, quantity and order date are required.",
        data: null,
      });
    }

    if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
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

    const order = await Order.create({
      cropId,
      quantity,
      orderDate,
      status,
    });

    await logActivity({
      user: req.user.username,
      action: "add",
      entity: "Order",
      entityId: order.id,
    });

    return res.status(201).json({
      succeeded: true,
      message: "Order created successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Create Order Error:", error.message);

    return res.status(400).json({
      succeeded: false,
      message: "Failed to create order. Please check your input.",
      data: null,
    });
  }
};

// UPDATE ORDER
const updateOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        succeeded: false,
        message: "Order not found.",
        data: null,
      });
    }

    const allowedFields = [
      "cropId",
      "quantity",
      "orderDate",
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

    if (
      updates.quantity !== undefined &&
      (!Number.isFinite(Number(updates.quantity)) ||
        Number(updates.quantity) <= 0)
    ) {
      return res.status(400).json({
        succeeded: false,
        message: "Quantity must be greater than zero.",
        data: null,
      });
    }

    await order.update(updates);

    await logActivity({
      user: req.user.username,
      action: "edit",
      entity: "Order",
      entityId: order.id,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Order updated successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Update Order Error:", error.message);

    return res.status(400).json({
      succeeded: false,
      message: "Failed to update order.",
      data: null,
    });
  }
};

// DELETE ORDER
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        succeeded: false,
        message: "Order not found.",
        data: null,
      });
    }

    const deletedOrderId = order.id;

    await order.destroy();

    await logActivity({
      user: req.user.username,
      action: "delete",
      entity: "Order",
      entityId: deletedOrderId,
    });

    return res.status(200).json({
      succeeded: true,
      message: "Order deleted successfully.",
      data: null,
    });
  } catch (error) {
    console.error("Delete Order Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Failed to delete order.",
      data: null,
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};
