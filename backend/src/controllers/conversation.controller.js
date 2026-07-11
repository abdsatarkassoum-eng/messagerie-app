const { Op } = require('sequelize');
const {
  Conversation,
  ConversationMember,
  Message,
  User,
  Friendship,
} = require('../models');
const { sanitize } = require('./auth.controller');

// GET /api/conversations - liste des conversations de l'utilisateur
async function listConversations(req, res) {
  try {
    const memberships = await ConversationMember.findAll({
      where: { userId: req.user.id },
    });
    const conversationIds = memberships.map((m) => m.conversationId);

    const conversations = await Conversation.findAll({
      where: { id: conversationIds },
      order: [['lastMessageAt', 'DESC']],
    });

    const result = [];
    for (const conv of conversations) {
      const members = await ConversationMember.findAll({
        where: { conversationId: conv.id },
      });
      const users = await User.findAll({ where: { id: members.map((m) => m.userId) } });

      const lastMessage = await Message.findOne({
        where: { conversationId: conv.id },
        order: [['createdAt', 'DESC']],
      });

      let displayName = conv.name;
      let displayAvatar = conv.avatarUrl;
      if (!conv.isGroup) {
        const other = users.find((u) => u.id !== req.user.id);
        displayName = other ? other.username : 'Conversation';
        displayAvatar = other ? other.avatarUrl : null;
      }

      result.push({
        id: conv.id,
        isGroup: conv.isGroup,
        name: displayName,
        avatarUrl: displayAvatar,
        members: users.map(sanitize),
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
      });
    }

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

    // Vérifie s'il existe déjà une conversation privée entre les deux
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

module.exports = { listConversations, createOrGetPrivateConversation, getMessages };
