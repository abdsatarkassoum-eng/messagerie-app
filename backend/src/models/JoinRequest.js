const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JoinRequest = sequelize.define(
  'JoinRequest',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    invitationId: {
      type: DataTypes.UUID,
      allowNull: true, // peut être null si demande spontanée (sans lien)
    },
    fullName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    // paiement
    paymentRequired: { type: DataTypes.BOOLEAN, defaultValue: false },
    paymentStatus: {
      type: DataTypes.ENUM('none', 'pending', 'paid', 'failed'),
      defaultValue: 'none',
    },
    paymentReference: { type: DataTypes.STRING, allowNull: true },
    // token unique envoyé une fois la demande approuvée (et payée si requis)
    registrationToken: { type: DataTypes.STRING, allowNull: true, unique: true },
    registrationTokenUsed: { type: DataTypes.BOOLEAN, defaultValue: false },
    reviewedBy: { type: DataTypes.UUID, allowNull: true },
  },
  {
    tableName: 'join_requests',
    timestamps: true,
  }
);

module.exports = JoinRequest;
