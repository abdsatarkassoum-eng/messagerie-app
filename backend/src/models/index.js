 const sequelize = require('../config/database');
const User = require('./User');
const FriendRequest = require('./FriendRequest');
const Friendship = require('./Friendship');
const Conversation = require('./Conversation');
const ConversationMember = require('./ConversationMember');
const Message = require('./Message');
const Invitation = require('./Invitation');
const JoinRequest = require('./JoinRequest');
const Status = require('./Status');
const StatusView = require('./StatusView');
const StatusLike = require('./StatusLike');
const StatusComment = require('./StatusComment');
const Post = require('./Post');
const PostLike = require('./PostLike');
const PostComment = require('./PostComment');
const CatalogItem = require('./CatalogItem');
const PushSubscription = require('./PushSubscription');
const Notification = require('./Notification');

// --- Associations ---

User.hasMany(Message, { foreignKey: 'senderId', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

Conversation.hasMany(ConversationMember, { foreignKey: 'conversationId', as: 'members' });
ConversationMember.belongsTo(Conversation, { foreignKey: 'conversationId' });
ConversationMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(ConversationMember, { foreignKey: 'userId' });

User.hasMany(FriendRequest, { foreignKey: 'senderId', as: 'sentFriendRequests' });
User.hasMany(FriendRequest, { foreignKey: 'receiverId', as: 'receivedFriendRequests' });

User.hasMany(Invitation, { foreignKey: 'createdBy', as: 'invitations' });
Invitation.hasMany(JoinRequest, { foreignKey: 'invitationId', as: 'joinRequests' });

User.hasMany(Status, { foreignKey: 'userId', as: 'statuses' });
Status.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Status.hasMany(StatusView, { foreignKey: 'statusId', as: 'views' });
Status.hasMany(StatusLike, { foreignKey: 'statusId', as: 'likes' });
Status.hasMany(StatusComment, { foreignKey: 'statusId', as: 'comments' });
StatusComment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });
Post.hasMany(PostLike, { foreignKey: 'postId', as: 'likes' });
Post.hasMany(PostComment, { foreignKey: 'postId', as: 'comments' });
PostComment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

User.hasMany(CatalogItem, { foreignKey: 'userId', as: 'catalogItems' });
CatalogItem.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

User.hasMany(PushSubscription, { foreignKey: 'userId', as: 'pushSubscriptions' });
PushSubscription.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'fromUserId', as: 'fromUser' });

async function syncDatabase() {
  await sequelize.sync();

  console.log(`ℹ️  Dialecte de base de données détecté : ${sequelize.getDialect()}`);

  if (sequelize.getDialect() === 'postgres') {
    const migrations = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "wallpaper" VARCHAR(255) DEFAULT 'default'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "profileVisibility" VARCHAR(255) DEFAULT 'everyone'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "mediaAutoDownload" BOOLEAN DEFAULT true`,
      `ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS "images" TEXT DEFAULT '[]'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "googleId" VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetToken" VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE users ALTER COLUMN password DROP NOT NULL`,
      `ALTER TABLE statuses ADD COLUMN IF NOT EXISTS "trimStart" FLOAT`,
      `ALTER TABLE statuses ADD COLUMN IF NOT EXISTS "trimEnd" FLOAT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "productsLink" VARCHAR(500)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "servicesLink" VARCHAR(500)`,
    ];

    for (const query of migrations) {
      try {
        await sequelize.query(query);
        console.log(`✅ Migration exécutée : ${query}`);
      } catch (err) {
        console.error(`⚠️  Avertissement de migration (${query}) :`, err.message);
      }
    }
  }
}

module.exports = {
  sequelize,
  User,
  FriendRequest,
  Friendship,
  Conversation,
  ConversationMember,
  Message,
  Invitation,
  JoinRequest,
  Status,
  StatusView,
  StatusLike,
  StatusComment,
  Post,
  PostLike,
  PostComment,
  CatalogItem,
  PushSubscription,
  Notification,
  syncDatabase,
};
