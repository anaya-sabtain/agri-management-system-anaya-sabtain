const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const sequelize = require("../config/db");

const User = sequelize.define(
  "User",
  {
    // Unique user ID
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // User's full name
    fullName: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },

    // Unique username
    username: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
    },

    // Unique email
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    // Hashed password
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // User role
    role: {
      type: DataTypes.ENUM("admin", "manager"),
      defaultValue: "manager",
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

// Password hashing function
const hashPassword = async (user) => {
  if (user.changed("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
};

// Hash password before creating a user
User.beforeCreate(hashPassword);

// Hash password before updating a user's password
User.beforeUpdate(hashPassword);

// Compare entered password with stored hash
User.prototype.matchPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = User;
