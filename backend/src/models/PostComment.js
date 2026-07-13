const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PostComment = sequelize.define(
  'PostComment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    postId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: 'post_comments',
    timestamps: true,
  }
);

module.exports = PostComment;
