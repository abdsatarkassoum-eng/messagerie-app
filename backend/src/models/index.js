const sequelize = require('../config/database');
const User = require('./User');
const FriendRequest = require('./FriendRequest');
const Friendship = require('./Friendship');
const Conversation = require('./Conversation');
const ConversationMember = require('./ConversationMember');
const Message = require('./Message');
const Invitation = require('./Invitation');
const JoinRequest = require('./JoinRequest');

// --- Associations ---

// Messages
User.hasMany(Message, { foreignKey: 'senderId', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

// Membres de conversation
Conversation.hasMany(ConversationMember, { foreignKey: 'conversationId', as: 'members' });
ConversationMember.belongsTo(Conversation, { foreignKey: 'conversationId' });
ConversationMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(ConversationMember, { foreignKey: 'userId' });

// Demandes d'amis
User.hasMany(FriendRequest, { foreignKey: 'senderId', as: 'sentFriendRequests' });
User.hasMany(FriendRequest, { foreignKey: 'receiverId', as: 'receivedFriendRequests' });

// Invitations
User.hasMany(Invitation, { foreignKey: 'createdBy', as: 'invitations' });
Invitation.hasMany(JoinRequest, { foreignKey: 'invitationId', as: 'joinRequests' });

async function syncDatabase() {
  await sequelize.sync();
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
  syncDatabase,
};
