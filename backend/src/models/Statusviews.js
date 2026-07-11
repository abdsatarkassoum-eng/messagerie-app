const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StatusView = sequelize.define(
  'StatusView',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    statusId: { type: DataTypes.UUID, allowNull: false },
    viewerId: { type: DataTypes.UUID, allowNull: false },
    viewedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'status_views',
    timestamps: false,
  }
);

module.exports = StatusView;
