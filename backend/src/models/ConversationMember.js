const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConversationMember = sequelize.define(
  'ConversationMember',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversationId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      defaultValue: 'member',
    },
    lastReadAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'conversation_members',
    timestamps: true,
  }
);

module.exports = ConversationMember;
