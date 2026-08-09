const { Conversation, Message } = require('../models');
const { sanitize } = require('./auth.controller');
const { notify } = require('../utils/notify');

// POST /api/calls/log
// body: { conversationId, peerId, callType, outcome, durationSeconds }
// outcome : 'missed' (pas décroché) | 'declined' (refusé) | 'completed' (terminé normalement)
async function logCall(req, res) {
  try {
    const { conversationId, peerId, callType, outcome, durationSeconds } = req.body;
    if (!conversationId || !peerId || !callType || !outcome) {
      return res.status(400).json({ message: 'Champs manquants.' });
    }

    const label = callType === 'video' ? 'Appel vidéo' : 'Appel audio';

    // On stocke les infos structurées en JSON dans "content" — le type 'system'
    // est déjà prévu pour ce genre de message spécial (pas une bulle de texte classique)
    const message = await Message.create({
      conversationId,
      senderId: req.user.id,
      type: 'system',
      content: JSON.stringify({
        kind: 'call',
        callType,
        outcome,
        durationSeconds: durationSeconds || 0,
      }),
    });

    const conversation = await Conversation.findByPk(conversationId);
    if (conversation) {
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }

    const payload = {
      id: message.id,
      conversationId,
      senderId: req.user.id,
      sender: sanitize(req.user),
      type: message.type,
      content: message.content,
      fileUrl: null,
      fileName: null,
      createdAt: message.createdAt,
    };

    const io = req.app.get('io');
    io?.to(`conversation:${conversationId}`).emit('message:new', payload);

    // Notification uniquement si l'appel a été manqué ou refusé
    if (outcome === 'missed' || outcome === 'declined') {
      notify(io, {
        userId: peerId,
        type: 'missed_call',
        fromUserId: req.user.id,
        conversationId,
        title: req.user.username,
        body: `${label} manqué`,
        url: '/',
      }).catch(() => {});
    }

    return res.status(201).json({ message: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur lors de l'enregistrement de l'appel." });
  }
}

module.exports = { logCall };
