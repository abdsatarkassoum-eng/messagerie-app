const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PostLike = sequelize.define(
  'PostLike',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    postId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    tableName: 'post_likes',
    timestamps: true,
  }
);

module.exports = PostLike;
