const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StatusLike = sequelize.define(
  'StatusLike',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    statusId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    tableName: 'status_likes',
    timestamps: true,
  }
);

module.exports = StatusLike;
