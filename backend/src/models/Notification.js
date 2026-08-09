const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false }, // destinataire
    type: {
      type: DataTypes.ENUM('message', 'missed_call', 'call_ended'),
      allowNull: false,
    },
    fromUserId: { type: DataTypes.UUID, allowNull: true },
    conversationId: { type: DataTypes.UUID, allowNull: true },
    title: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.STRING, allowNull: true },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: 'notifications',
    timestamps: true,
  }
);

module.exports = Notification;
