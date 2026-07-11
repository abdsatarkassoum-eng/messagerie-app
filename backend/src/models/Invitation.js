const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invitation = sequelize.define(
  'Invitation',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    maxUses: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    usesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'invitations',
    timestamps: true,
  }
);

module.exports = Invitation;
