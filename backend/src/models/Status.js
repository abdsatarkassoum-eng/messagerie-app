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
    content: { type: DataTypes.TEXT, allowNull: true }, // texte du statut ou légende
    fileUrl: { type: DataTypes.STRING, allowNull: true },
    backgroundColor: { type: DataTypes.STRING, allowNull: true }, // pour les statuts texte
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    tableName: 'statuses',
    timestamps: true,
  }
);

module.exports = Status;
