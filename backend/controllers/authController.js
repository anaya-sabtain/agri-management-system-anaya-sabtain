const { User } = require("../models");
const generateToken = require("../utils/generateToken");

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    // Validate required fields
    if (!fullName || !username || !email || !password) {
      return res.status(400).json({
        succeeded: false,
        message: "Please provide all required fields.",
        data: null,
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        succeeded: false,
        message: "Password must contain at least 8 characters.",
        data: null,
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        succeeded: false,
        message: "Email is already registered.",
        data: null,
      });
    }

    const existingUsername = await User.findOne({
      where: {
        username,
      },
    });

    if (existingUsername) {
      return res.status(409).json({
        succeeded: false,
        message: "Username is already taken.",
        data: null,
      });
    }

    // Create user
    // Password will be hashed by the User model hook
    const user = await User.create({
      fullName,
      username,
      email,
      password,
      role: "manager",
    });

    return res.status(201).json({
      succeeded: true,
      message: "User registered successfully.",
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user),
      },
    });
  } catch (error) {
    console.error("Registration Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Registration failed.",
      data: null,
    });
  }
};


// Get currently authenticated user
const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({
      succeeded: true,
      message: "User profile fetched successfully",
      user: {
        id: req.user.id,
        fullName: req.user.fullName,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      succeeded: false,
      message: "Unable to fetch user profile",
      data: null,
    });
  }
};


const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        succeeded: false,
        message: "Please provide email and password.",
        data: null,
      });
    }

    // Find user by email
    const user = await User.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        succeeded: false,
        message: "Invalid email or password.",
        data: null,
      });
    }

    // Compare entered password with hashed password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        succeeded: false,
        message: "Invalid email or password.",
        data: null,
      });
    }

    return res.status(200).json({
      succeeded: true,
      message: "Login successful.",
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user),
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);

    return res.status(500).json({
      succeeded: false,
      message: "Login failed.",
      data: null,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
