const { Op } = require('sequelize');
const { FriendRequest, Friendship, User } = require('../models');
const { sanitize } = require('./auth.controller');

function pairKey(a, b) {
  return [a, b].sort();
}

// POST /api/friends/request  { receiverId }
async function sendRequest(req, res) {
  try {
    const senderId = req.user.id;
    const { receiverId } = req.body;

    if (receiverId === senderId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous ajouter vous-même.' });
    }

    const receiver = await User.findByPk(receiverId);
    if (!receiver) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const [a, b] = pairKey(senderId, receiverId);
    const alreadyFriends = await Friendship.findOne({
      where: { userAId: a, userBId: b },
    });
    if (alreadyFriends) {
      return res.status(409).json({ message: 'Vous êtes déjà amis.' });
    }

    const existing = await FriendRequest.findOne({
      where: {
        status: 'pending',
        [Op.or]: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });
    if (existing) {
      return res.status(409).json({ message: 'Une demande est déjà en attente.' });
    }

    const request = await FriendRequest.create({ senderId, receiverId });

    // notifier en temps réel si le module socket est disponible
    req.app.get('io')?.to(`user:${receiverId}`).emit('friend_request:new', {
      id: request.id,
      sender: sanitize(req.user),
    });

    return res.status(201).json({ message: 'Demande envoyée.', request });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur lors de l'envoi de la demande." });
  }
}

// POST /api/friends/respond  { requestId, action: 'accept' | 'reject' }
async function respondRequest(req, res) {
  try {
    const { requestId, action } = req.body;
    const request = await FriendRequest.findByPk(requestId);

    if (!request || request.receiverId !== req.user.id) {
      return res.status(404).json({ message: 'Demande introuvable.' });
    }
    if (request.status !== 'pending') {
      return res.status(409).json({ message: 'Cette demande a déjà été traitée.' });
    }

    if (action === 'accept') {
      request.status = 'accepted';
      await request.save();

      const [a, b] = pairKey(request.senderId, request.receiverId);
      await Friendship.create({ userAId: a, userBId: b });

      req.app.get('io')?.to(`user:${request.senderId}`).emit('friend_request:accepted', {
        by: sanitize(req.user),
      });

      return res.json({ message: 'Demande acceptée.' });
    } else if (action === 'reject') {
      request.status = 'rejected';
      await request.save();
      return res.json({ message: 'Demande refusée.' });
    }

    return res.status(400).json({ message: 'Action invalide.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors du traitement de la demande.' });
  }
}

// GET /api/friends/requests
async function listRequests(req, res) {
  try {
    const received = await FriendRequest.findAll({
      where: { receiverId: req.user.id, status: 'pending' },
      include: [{ model: User, as: undefined }],
    });

    const senders = await User.findAll({
      where: { id: received.map((r) => r.senderId) },
    });
    const sendersMap = Object.fromEntries(senders.map((s) => [s.id, sanitize(s)]));

    const sent = await FriendRequest.findAll({
      where: { senderId: req.user.id, status: 'pending' },
    });

    return res.json({
      received: received.map((r) => ({ id: r.id, sender: sendersMap[r.senderId], createdAt: r.createdAt })),
      sent,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération des demandes.' });
  }
}

// GET /api/friends
async function listFriends(req, res) {
  try {
    const userId = req.user.id;
    const friendships = await Friendship.findAll({
      where: { [Op.or]: [{ userAId: userId }, { userBId: userId }] },
    });

    const friendIds = friendships.map((f) => (f.userAId === userId ? f.userBId : f.userAId));
    const friends = await User.findAll({ where: { id: friendIds } });

    return res.json({ friends: friends.map(sanitize) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération de la liste d\'amis.' });
  }
}

// DELETE /api/friends/:friendId
async function removeFriend(req, res) {
  try {
    const [a, b] = pairKey(req.user.id, req.params.friendId);
    await Friendship.destroy({ where: { userAId: a, userBId: b } });
    return res.json({ message: 'Ami supprimé.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
}

module.exports = { sendRequest, respondRequest, listRequests, listFriends, removeFriend };
