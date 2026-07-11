const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define(
  'Message',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversationId: { type: DataTypes.UUID, allowNull: false },
    senderId: { type: DataTypes.UUID, allowNull: false },
    type: {
      type: DataTypes.ENUM('text', 'image', 'video', 'file', 'audio', 'system'),
      defaultValue: 'text',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true, // texte du message OU légende du fichier
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // liste JSON des userId ayant vu le message
    seenBy: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'messages',
    timestamps: true,
  }
);

module.exports = Message;
