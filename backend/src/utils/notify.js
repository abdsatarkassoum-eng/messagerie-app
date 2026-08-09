const { Notification } = require('../models');
const { sendPushToUser } = require('./webPush');

// Crée une notification en base, la diffuse en temps réel (Socket.io), et envoie un push.
async function notify(io, { userId, type, fromUserId, conversationId, title, body, url }) {
  const notification = await Notification.create({
    userId,
    type,
    fromUserId: fromUserId || null,
    conversationId: conversationId || null,
    title,
    body: body || null,
  });

  const payload = {
    id: notification.id,
    type: notification.type,
    fromUserId: notification.fromUserId,
    conversationId: notification.conversationId,
    title: notification.title,
    body: notification.body,
    read: notification.read,
    createdAt: notification.createdAt,
  };

  io?.to(`user:${userId}`).emit('notification:new', payload);

  sendPushToUser(userId, {
    title,
    body: body || '',
    url: url || '/',
  }).catch(() => {});

  return notification;
}

module.exports = { notify };
