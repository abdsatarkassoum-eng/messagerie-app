const { Notification, User } = require('../models');
const { sanitize } = require('./auth.controller');

// GET /api/notifications
async function listNotifications(req, res) {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const fromUserIds = [...new Set(notifications.map((n) => n.fromUserId).filter(Boolean))];
    const fromUsers = await User.findAll({ where: { id: fromUserIds } });
    const fromUsersById = Object.fromEntries(fromUsers.map((u) => [u.id, sanitize(u)]));

    return res.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        fromUser: n.fromUserId ? fromUsersById[n.fromUserId] || null : null,
        conversationId: n.conversationId,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: n.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération des notifications.' });
  }
}

// POST /api/notifications/read-all
async function markAllRead(req, res) {
  try {
    await Notification.update({ read: true }, { where: { userId: req.user.id, read: false } });
    return res.json({ message: 'Notifications marquées comme lues.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/notifications/:id/read
async function markOneRead(req, res) {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({ message: 'Notification introuvable.' });
    }
    notification.read = true;
    await notification.save();
    return res.json({ message: 'Notification marquée comme lue.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { listNotifications, markAllRead, markOneRead };
