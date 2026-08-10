const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Status = sequelize.define(
  'Status',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    type: {
      type: DataTypes.ENUM('text', 'image', 'video'),
      defaultValue: 'text',
    },
    content: { type: DataTypes.TEXT, allowNull: true },
    fileUrl: { type: DataTypes.STRING, allowNull: true },
    backgroundColor: { type: DataTypes.STRING, allowNull: true },
    // Portion de la vidéo à lire, en secondes (uniquement pour type = 'video')
    trimStart: { type: DataTypes.FLOAT, allowNull: true },
    trimEnd: { type: DataTypes.FLOAT, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    tableName: 'statuses',
    timestamps: true,
  }
);

module.exports = Status;
