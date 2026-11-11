const jwt = require("jsonwebtoken");
const { User } = require("../models");

const protect = async (req, res, next) => {
  try {
    let token;

    // Read token from Authorization header
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        succeeded: false,
        message: "Not authorized. Token is missing.",
        data: null,
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Find user in database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(401).json({
        succeeded: false,
        message: "User no longer exists.",
        data: null,
      });
    }

    // Attach authenticated user to request
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      succeeded: false,
      message: "Invalid or expired token.",
      data: null,
    });
  }
};

module.exports = { protect };
