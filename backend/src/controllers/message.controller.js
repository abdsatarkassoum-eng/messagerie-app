const { Conversation, ConversationMember, Message, User } = require('../models');
const { sanitize } = require('./auth.controller');
const uploadFile = require('../utils/uploadFile');
const { notify } = require('../utils/notify');

async function assertMember(conversationId, userId) {
  return ConversationMember.findOne({ where: { conversationId, userId } });
}

// POST /api/messages { conversationId, content, type }
async function sendMessage(req, res) {
  try {
    const { conversationId, content } = req.body;
    let { type } = req.body;

    const member = await assertMember(conversationId, req.user.id);
    if (!member) return res.status(403).json({ message: 'Vous ne faites pas partie de cette conversation.' });

    let fileUrl = null;
    let fileName = null;

    if (req.file) {
      const folder = req.file.mimetype.startsWith('image/')
        ? 'images'
        : req.file.mimetype.startsWith('video/')
        ? 'videos'
        : req.file.mimetype.startsWith('audio/')
        ? 'audio'
        : 'files';
      fileUrl = await uploadFile(req.file, folder);
      fileName = req.file.originalname;
      if (!type || type === 'text') {
        type = folder === 'audio' ? 'audio' : folder === 'images' ? 'image' : folder === 'videos' ? 'video' : 'file';
      }
    } else if (!type) {
      type = 'text';
    }

    if (!content && !fileUrl) {
      return res.status(400).json({ message: 'Le message ne peut pas être vide.' });
    }

    // seenBy stocke désormais { userId: dateISO } au lieu d'une simple liste,
    // pour connaître l'heure exacte de lecture (pas juste le fait d'avoir lu)
    const message = await Message.create({
      conversationId,
      senderId: req.user.id,
      type,
      content: content || null,
      fileUrl,
      fileName,
      seenBy: JSON.stringify({ [req.user.id]: new Date().toISOString() }),
    });

    const conversation = await Conversation.findByPk(conversationId);
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const payload = {
      id: message.id,
      conversationId,
      senderId: req.user.id,
      sender: sanitize(req.user),
      type: message.type,
      content: message.content,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      seenBy: message.seenBy,
      createdAt: message.createdAt,
    };

    const io = req.app.get('io');

    io?.to(`conversation:${conversationId}`).emit('message:new', payload);

    const otherMembers = await ConversationMember.findAll({
      where: { conversationId },
    });
    const preview = message.type === 'text' ? message.content : '📎 Pièce jointe';
    otherMembers
      .filter((m) => m.userId !== req.user.id)
      .forEach((m) => {
        notify(io, {
          userId: m.userId,
          type: 'message',
          fromUserId: req.user.id,
          conversationId,
          title: conversation.isGroup ? `${req.user.username} (${conversation.name})` : req.user.username,
          body: preview || 'Nouveau message',
          url: '/',
        }).catch(() => {});
      });

    return res.status(201).json({ message: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur lors de l'envoi du message." });
  }
}

// DELETE /api/messages/:id
async function deleteMessage(req, res) {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message introuvable.' });
    if (message.senderId !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres messages.' });
    }

    message.deleted = true;
    message.content = null;
    message.fileUrl = null;
    await message.save();

    req.app.get('io')?.to(`conversation:${message.conversationId}`).emit('message:deleted', {
      id: message.id,
      conversationId: message.conversationId,
    });

    return res.json({ message: 'Message supprimé.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
}

// POST /api/messages/:id/seen
async function markSeen(req, res) {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message introuvable.' });

    let seenBy = {};
    try {
      seenBy = JSON.parse(message.seenBy || '{}');
    } catch {
      seenBy = {};
    }

    if (!seenBy[req.user.id]) {
      const seenAt = new Date().toISOString();
      seenBy[req.user.id] = seenAt;
      message.seenBy = JSON.stringify(seenBy);
      await message.save();

      req.app.get('io')?.to(`conversation:${message.conversationId}`).emit('message:seen', {
        messageId: message.id,
        conversationId: message.conversationId,
        userId: req.user.id,
        seenAt,
      });
    }

    return res.json({ message: 'Marqué comme vu.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { sendMessage, deleteMessage, markSeen };
