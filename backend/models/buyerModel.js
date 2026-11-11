const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Buyer = sequelize.define(
  "Buyer",
  {
    // Unique buyer ID
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Buyer's name
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    // Unique CNIC
    cnic: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
      validate: {
        is: /^\d{5}-\d{7}-\d{1}$/,
      },
    },

    // Uploaded buyer photo path
    photoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Related crop ID
    cropId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    // Purchased crop quantity
    quantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },

    // Buyer record date
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    tableName: "buyers",
    timestamps: true,
  }
);

module.exports = Buyer;
