const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define(
  'Post',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: true },
    fileUrl: { type: DataTypes.STRING, allowNull: true },
    type: {
      type: DataTypes.ENUM('text', 'image', 'video'),
      defaultValue: 'text',
    },
  },
  {
    tableName: 'posts',
    timestamps: true,
  }
);

module.exports = Post;
