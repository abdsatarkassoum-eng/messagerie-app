const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Relation d'amitié bidirectionnelle (une ligne = une paire d'amis)
const Friendship = sequelize.define(
  'Friendship',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userAId: { type: DataTypes.UUID, allowNull: false },
    userBId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    tableName: 'friendships',
    timestamps: true,
  }
);

module.exports = Friendship;
