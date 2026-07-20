 const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatalogItem = sequelize.define(
  'CatalogItem',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    type: {
      type: DataTypes.ENUM('product', 'service'),
      defaultValue: 'product',
    },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    price: { type: DataTypes.STRING, allowNull: true },
    fileUrl: { type: DataTypes.STRING, allowNull: true },
    images: { type: DataTypes.TEXT, defaultValue: '[]' }, // tableau JSON d'URLs
  },
  {
    tableName: 'catalog_items',
    timestamps: true,
  }
);

module.exports = CatalogItem;
