const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StatusComment = sequelize.define(
  'StatusComment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    statusId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: 'status_comments',
    timestamps: true,
  }
);

module.exports = StatusComment;
