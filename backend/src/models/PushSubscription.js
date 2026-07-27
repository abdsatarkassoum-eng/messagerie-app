const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PushSubscription = sequelize.define(
  'PushSubscription',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    endpoint: { type: DataTypes.TEXT, allowNull: false },
    p256dh: { type: DataTypes.STRING, allowNull: false },
    auth: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: 'push_subscriptions',
    timestamps: true,
  }
);

module.exports = PushSubscription;
