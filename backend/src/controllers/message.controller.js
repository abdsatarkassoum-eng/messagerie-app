 const { Conversation, ConversationMember, Message, User } = require('../models');
const { sanitize } = require('./auth.controller');
const uploadFile = require('../utils/uploadFile');

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

    const message = await Message.create({
      conversationId,
      senderId: req.user.id,
      type,
      content: content || null,
      fileUrl,
      fileName,
      seenBy: JSON.stringify([req.user.id]),
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
      createdAt: message.createdAt,
    };

    // Diffuser en temps réel à tous les membres de la conversation
    req.app.get('io')?.to(`conversation:${conversationId}`).emit('message:new', payload);

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

    const seenBy = JSON.parse(message.seenBy || '[]');
    if (!seenBy.includes(req.user.id)) {
      seenBy.push(req.user.id);
      message.seenBy = JSON.stringify(seenBy);
      await message.save();

      req.app.get('io')?.to(`conversation:${message.conversationId}`).emit('message:seen', {
        messageId: message.id,
        conversationId: message.conversationId,
        userId: req.user.id,
      });
    }

    return res.json({ message: 'Marqué comme vu.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { sendMessage, deleteMessage, markSeen };
