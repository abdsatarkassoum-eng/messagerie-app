const { Op } = require('sequelize');
const {
  sequelize,
  Conversation,
  ConversationMember,
  Message,
  User,
} = require('../models');
const { sanitize } = require('./auth.controller');

// GET /api/conversations - liste des conversations de l'utilisateur
// Version optimisée : tout est chargé en quelques requêtes groupées,
// au lieu d'une boucle qui interroge la base pour chaque conversation.
async function listConversations(req, res) {
  try {
    const myMemberships = await ConversationMember.findAll({
      where: { userId: req.user.id },
    });
    const conversationIds = myMemberships.map((m) => m.conversationId);

    if (conversationIds.length === 0) {
      return res.json({ conversations: [] });
    }

    const conversations = await Conversation.findAll({
      where: { id: conversationIds },
      order: [['lastMessageAt', 'DESC']],
    });

    // Tous les membres de toutes ces conversations, en une seule requête
    const allMembers = await ConversationMember.findAll({
      where: { conversationId: conversationIds },
    });
    const membersByConv = {};
    allMembers.forEach((m) => {
      if (!membersByConv[m.conversationId]) membersByConv[m.conversationId] = [];
      membersByConv[m.conversationId].push(m);
    });

    // Tous les utilisateurs concernés, en une seule requête
    const userIds = [...new Set(allMembers.map((m) => m.userId))];
    const users = await User.findAll({ where: { id: userIds } });
    const usersMap = Object.fromEntries(users.map((u) => [u.id, u]));

    // Dernier message de chaque conversation, en une seule requête (PostgreSQL)
    const lastMessages = await sequelize.query(
      `SELECT DISTINCT ON ("conversationId") *
       FROM messages
       WHERE "conversationId" IN (:ids)
       ORDER BY "conversationId", "createdAt" DESC`,
      { replacements: { ids: conversationIds }, type: sequelize.QueryTypes.SELECT }
    );
    const lastMessageByConv = Object.fromEntries(lastMessages.map((m) => [m.conversationId, m]));

    // Nombre de messages non lus par conversation, en une seule requête
    const unreadRows = await sequelize.query(
      `SELECT cm."conversationId" AS "conversationId", COUNT(m.id) AS "unreadCount"
       FROM conversation_members cm
       JOIN messages m
         ON m."conversationId" = cm."conversationId"
        AND m."senderId" != cm."userId"
        AND m."createdAt" > cm."lastReadAt"
       WHERE cm."userId" = :userId
       GROUP BY cm."conversationId"`,
      { replacements: { userId: req.user.id }, type: sequelize.QueryTypes.SELECT }
    );
    const unreadByConv = Object.fromEntries(unreadRows.map((r) => [r.conversationId, parseInt(r.unreadCount, 10)]));

    const result = conversations.map((conv) => {
      const members = membersByConv[conv.id] || [];
      const memberUsers = members.map((m) => usersMap[m.userId]).filter(Boolean);

      let displayName = conv.name;
      let displayAvatar = conv.avatarUrl;
      if (!conv.isGroup) {
        const other = memberUsers.find((u) => u.id !== req.user.id);
        displayName = other ? other.username : 'Conversation';
        displayAvatar = other ? other.avatarUrl : null;
      }

      const lastMessage = lastMessageByConv[conv.id] || null;

      let lastMessageSeenByOther = null;
      if (!conv.isGroup && lastMessage && lastMessage.senderId === req.user.id) {
        const otherMembership = members.find((m) => m.userId !== req.user.id);
        lastMessageSeenByOther =
          !!otherMembership && new Date(otherMembership.lastReadAt) >= new Date(lastMessage.createdAt);
      }

      return {
        id: conv.id,
        isGroup: conv.isGroup,
        name: displayName,
        avatarUrl: displayAvatar,
        members: memberUsers.map(sanitize),
        memberRoles: Object.fromEntries(members.map((m) => [m.userId, m.role])),
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              type: lastMessage.type,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            }
          : null,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: unreadByConv[conv.id] || 0,
        lastMessageSeenByOther,
      };
    });

    return res.json({ conversations: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération des conversations.' });
  }
}

// POST /api/conversations/private { userId }
async function createOrGetPrivateConversation(req, res) {
  try {
    const { userId } = req.body;
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Conversation invalide.' });
    }

    const other = await User.findByPk(userId);
    if (!other) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const myMemberships = await ConversationMember.findAll({ where: { userId: req.user.id } });
    const myConvIds = myMemberships.map((m) => m.conversationId);

    const theirMemberships = await ConversationMember.findAll({
      where: { userId, conversationId: myConvIds },
    });

    for (const tm of theirMemberships) {
      const conv = await Conversation.findByPk(tm.conversationId);
      if (conv && !conv.isGroup) {
        return res.json({ conversationId: conv.id, existing: true });
      }
    }

    const conv = await Conversation.create({ isGroup: false, createdBy: req.user.id });
    await ConversationMember.bulkCreate([
      { conversationId: conv.id, userId: req.user.id, role: 'member' },
      { conversationId: conv.id, userId, role: 'member' },
    ]);

    return res.status(201).json({ conversationId: conv.id, existing: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la création de la conversation.' });
  }
}

// GET /api/conversations/:id/messages?before=&limit=
async function getMessages(req, res) {
  try {
    const { id } = req.params;
    const isMember = await ConversationMember.findOne({
      where: { conversationId: id, userId: req.user.id },
    });
    if (!isMember) return res.status(403).json({ message: 'Accès refusé à cette conversation.' });

    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const where = { conversationId: id };
    if (req.query.before) {
      where.createdAt = { [Op.lt]: new Date(req.query.before) };
    }

    const messages = await Message.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
    });

    return res.json({ messages: messages.reverse() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération des messages.' });
  }
}

// POST /api/conversations/:id/read
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const membership = await ConversationMember.findOne({
      where: { conversationId: id, userId: req.user.id },
    });
    if (!membership) return res.status(403).json({ message: 'Accès refusé à cette conversation.' });

    membership.lastReadAt = new Date();
    await membership.save();

    return res.json({ message: 'Conversation marquée comme lue.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour.' });
  }
}

module.exports = { listConversations, createOrGetPrivateConversation, getMessages, markAsRead };
