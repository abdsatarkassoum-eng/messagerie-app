 const { Op } = require('sequelize');
const { Status, StatusView, User, Friendship } = require('../models');
const { sanitize } = require('./auth.controller');
const uploadFile = require('../utils/uploadFile');

const STATUS_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 heures

async function getFriendIds(userId) {
  const friendships = await Friendship.findAll({
    where: { [Op.or]: [{ userAId: userId }, { userBId: userId }] },
  });
  return friendships.map((f) => (f.userAId === userId ? f.userBId : f.userAId));
}

// POST /api/statuses { type, content, backgroundColor }
async function createStatus(req, res) {
  try {
    let { type, content, backgroundColor } = req.body;
    let fileUrl = null;

    if (req.file) {
      const folder = req.file.mimetype.startsWith('video/') ? 'videos' : 'images';
      fileUrl = await uploadFile(req.file, folder);
      type = folder === 'videos' ? 'video' : 'image';
    } else {
      type = 'text';
      if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Le statut ne peut pas être vide.' });
      }
    }

    const status = await Status.create({
      userId: req.user.id,
      type,
      content: content || null,
      fileUrl,
      backgroundColor: backgroundColor || null,
      expiresAt: new Date(Date.now() + STATUS_LIFETIME_MS),
    });

    const friendIds = await getFriendIds(req.user.id);
    const io = req.app.get('io');
    friendIds.forEach((fid) => io?.to(`user:${fid}`).emit('status:new', { userId: req.user.id }));

    return res.status(201).json({ message: 'Statut publié.', status });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la publication du statut.' });
  }
}

// GET /api/statuses — statuts de l'utilisateur + de ses amis, groupés par personne
async function listStatuses(req, res) {
  try {
    const userId = req.user.id;
    const friendIds = await getFriendIds(userId);
    const relevantIds = [userId, ...friendIds];

    const statuses = await Status.findAll({
      where: {
        userId: relevantIds,
        expiresAt: { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'ASC']],
    });

    const users = await User.findAll({ where: { id: relevantIds } });
    const usersMap = Object.fromEntries(users.map((u) => [u.id, sanitize(u)]));

    const views = await StatusView.findAll({
      where: { statusId: statuses.map((s) => s.id), viewerId: userId },
    });
    const viewedSet = new Set(views.map((v) => v.statusId));

    const groupsMap = {};
    for (const s of statuses) {
      if (!groupsMap[s.userId]) {
        groupsMap[s.userId] = { user: usersMap[s.userId], statuses: [], hasUnseen: false };
      }
      const isOwn = s.userId === userId;
      const viewed = isOwn ? true : viewedSet.has(s.id);
      if (!viewed) groupsMap[s.userId].hasUnseen = true;
      groupsMap[s.userId].statuses.push({
        id: s.id,
        type: s.type,
        content: s.content,
        fileUrl: s.fileUrl,
        backgroundColor: s.backgroundColor,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        viewed,
      });
    }

    const groups = Object.values(groupsMap);
    const own = groups.find((g) => g.user?.id === userId) || null;
    const others = groups
      .filter((g) => g.user?.id !== userId)
      .sort((a, b) => (a.hasUnseen === b.hasUnseen ? 0 : a.hasUnseen ? -1 : 1));

    return res.json({ own, others });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération des statuts.' });
  }
}

// POST /api/statuses/:id/view
async function viewStatus(req, res) {
  try {
    const status = await Status.findByPk(req.params.id);
    if (!status) return res.status(404).json({ message: 'Statut introuvable.' });
    if (status.userId === req.user.id) return res.json({ message: 'OK' });

    const existing = await StatusView.findOne({
      where: { statusId: status.id, viewerId: req.user.id },
    });
    if (!existing) {
      await StatusView.create({ statusId: status.id, viewerId: req.user.id });
      req.app.get('io')?.to(`user:${status.userId}`).emit('status:viewed', {
        statusId: status.id,
        viewer: sanitize(req.user),
      });
    }

    return res.json({ message: 'OK' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// GET /api/statuses/:id/viewers — uniquement pour le propriétaire du statut
async function getViewers(req, res) {
  try {
    const status = await Status.findByPk(req.params.id);
    if (!status) return res.status(404).json({ message: 'Statut introuvable.' });
    if (status.userId !== req.user.id) {
      return res.status(403).json({ message: 'Seul le propriétaire peut voir cette liste.' });
    }

    const views = await StatusView.findAll({ where: { statusId: status.id } });
    const viewers = await User.findAll({ where: { id: views.map((v) => v.viewerId) } });
    const viewedAtMap = Object.fromEntries(views.map((v) => [v.viewerId, v.viewedAt]));

    return res.json({
      viewers: viewers.map((v) => ({ ...sanitize(v), viewedAt: viewedAtMap[v.id] })),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// DELETE /api/statuses/:id
async function deleteStatus(req, res) {
  try {
    const status = await Status.findByPk(req.params.id);
    if (!status) return res.status(404).json({ message: 'Statut introuvable.' });
    if (status.userId !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres statuts.' });
    }

    await StatusView.destroy({ where: { statusId: status.id } });
    await status.destroy();

    return res.json({ message: 'Statut supprimé.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
}

module.exports = { createStatus, listStatuses, viewStatus, getViewers, deleteStatus };
