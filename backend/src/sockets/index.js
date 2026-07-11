const jwt = require('jsonwebtoken');
const { User, ConversationMember } = require('../models');

function initSockets(io) {
  // Authentification du socket via le token JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentification requise.'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (!user) return next(new Error('Utilisateur introuvable.'));

      socket.userId = user.id;
      next();
    } catch (err) {
      next(new Error('Token invalide.'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;

    // Rejoint sa propre "room" personnelle (notifications) et celles de ses conversations
    socket.join(`user:${userId}`);
    const memberships = await ConversationMember.findAll({ where: { userId } });
    memberships.forEach((m) => socket.join(`conversation:${m.conversationId}`));

    // Marquer l'utilisateur en ligne
    await User.update({ status: 'online', lastSeen: new Date() }, { where: { id: userId } });
    io.emit('presence:update', { userId, status: 'online' });

    // --- Frappe en cours ---
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        isTyping: true,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // --- Rejoindre une nouvelle conversation dynamiquement (ex: après création d'un groupe) ---
    socket.on('conversation:join', ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
    });

    // --- Signalisation WebRTC pour les appels audio/vidéo ---
    socket.on('call:invite', ({ conversationId, targetUserId, offer, callType }) => {
      io.to(`user:${targetUserId}`).emit('call:incoming', {
        conversationId,
        fromUserId: userId,
        offer,
        callType, // 'audio' | 'video'
      });
    });

    socket.on('call:answer', ({ targetUserId, answer }) => {
      io.to(`user:${targetUserId}`).emit('call:answered', { fromUserId: userId, answer });
    });

    socket.on('call:ice-candidate', ({ targetUserId, candidate }) => {
      io.to(`user:${targetUserId}`).emit('call:ice-candidate', { fromUserId: userId, candidate });
    });

    socket.on('call:decline', ({ targetUserId }) => {
      io.to(`user:${targetUserId}`).emit('call:declined', { fromUserId: userId });
    });

    socket.on('call:end', ({ targetUserId }) => {
      io.to(`user:${targetUserId}`).emit('call:ended', { fromUserId: userId });
    });

    // --- Déconnexion ---
    socket.on('disconnect', async () => {
      await User.update(
        { status: 'offline', lastSeen: new Date() },
        { where: { id: userId } }
      );
      io.emit('presence:update', { userId, status: 'offline', lastSeen: new Date() });
    });
  });
}

module.exports = initSockets;
