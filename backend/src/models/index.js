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
const Hub = require('./Hub');
const Category = require('./Category');

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

Hub.hasMany(Category, { foreignKey: 'hubId', as: 'categories' });
Category.belongsTo(Hub, { foreignKey: 'hubId', as: 'hub' });
Category.hasMany(Conversation, { foreignKey: 'categoryId', as: 'salons' });
Conversation.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

async function seedHubsAndCategories() {
  const [gamingHub] = await Hub.findOrCreate({
    where: { slug: 'gaming' },
    defaults: { name: 'GamingHub', order: 1 },
  });
  const [funHub] = await Hub.findOrCreate({
    where: { slug: 'divertissement' },
    defaults: { name: 'Divertissement', order: 2 },
  });

  const gamingCategories = [
    { slug: 'football', name: 'Football' },
    { slug: 'basket', name: 'Basket' },
    { slug: 'aventure', name: "Jeux d'aventure" },
    { slug: 'battle-royale', name: 'Battle Royale' },
    { slug: 'fps', name: 'Tir (FPS)' },
    { slug: 'course', name: 'Course & Rallye' },
    { slug: 'combat', name: 'Jeux de combat' },
    { slug: 'strategie', name: 'Stratégie' },
    { slug: 'moba', name: 'MOBA' },
    { slug: 'rpg', name: 'RPG' },
    { slug: 'simulation', name: 'Simulation' },
    { slug: 'horreur', name: 'Horreur' },
    { slug: 'puzzle', name: 'Puzzle & Réflexion' },
    { slug: 'retro', name: 'Rétro & Arcade' },
    { slug: 'mobile', name: 'Gaming Mobile' },
    { slug: 'cartes', name: 'Cartes & Plateau' },
    { slug: 'rythme', name: 'Musique & Rythme' },
    { slug: 'esport', name: 'eSport compétitif' },
  ];
  const funCategories = [
    { slug: 'danse', name: 'Danse' },
    { slug: 'chant', name: 'Chant' },
    { slug: 'lecture-coranique', name: 'Lecture coranique' },
    { slug: 'bibliotheque', name: 'Bibliothèque' },
    { slug: 'cinema', name: 'Cinéma & Séries' },
    { slug: 'musique', name: 'Musique' },
    { slug: 'mode', name: 'Mode & Beauté' },
    { slug: 'cuisine', name: 'Cuisine' },
    { slug: 'art', name: 'Art & Dessin' },
    { slug: 'photo', name: 'Photographie' },
    { slug: 'humour', name: 'Humour' },
    { slug: 'spiritualite', name: 'Spiritualité' },
    { slug: 'bienetre', name: 'Bien-être' },
    { slug: 'voyage', name: 'Voyage' },
    { slug: 'fitness', name: 'Fitness & Sport' },
    { slug: 'devperso', name: 'Développement personnel' },
    { slug: 'business', name: 'Business & Entrepreneuriat' },
    { slug: 'langues', name: 'Éducation & Langues' },
  ];

  for (let i = 0; i < gamingCategories.length; i++) {
    await Category.findOrCreate({
      where: { hubId: gamingHub.id, slug: gamingCategories[i].slug },
      defaults: { name: gamingCategories[i].name, order: i },
    });
  }
  for (let i = 0; i < funCategories.length; i++) {
    await Category.findOrCreate({
      where: { hubId: funHub.id, slug: funCategories[i].slug },
      defaults: { name: funCategories[i].name, order: i },
    });
  }
}

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
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "productsLinkPreview" TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "servicesLinkPreview" TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "verifiedUntil" TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS "categoryId" UUID`,
      `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN DEFAULT false`,
      `ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS "saleLink" VARCHAR(255)`,
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

  await seedHubsAndCategories();
  console.log('✅ Hubs et catégories initialisés.');
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
  Hub,
  Category,
  syncDatabase,
};
