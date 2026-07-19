 const bcrypt = require('bcryptjs');
const { Op, Sequelize } = require('sequelize');
const { User, Friendship, FriendRequest, Conversation, ConversationMember, Post } = require('../models');
const { sanitize } = require('./auth.controller');
const uploadFile = require('../utils/uploadFile');
const { enrichPostsBatch } = require('./post.controller');

async function getFriendIdsFor(userId) {
  const friendships = await Friendship.findAll({
    where: { [Op.or]: [{ userAId: userId }, { userBId: userId }] },
  });
  return friendships.map((f) => (f.userAId === userId ? f.userBId : f.userAId));
}

function applyPrivacy(candidate, isFriend) {
  const base = sanitize(candidate);
  if (base.profileVisibility === 'friends' && !isFriend) {
    return { ...base, avatarUrl: null };
  }
  return base;
}

// GET /api/users/search?q=
async function searchUsers(req, res) {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    if (!q) return res.json({ users: [] });

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: req.user.id },
        [Op.or]: [
          Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('username')), {
            [Op.like]: `%${q}%`,
          }),
          Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('email')), {
            [Op.like]: `%${q}%`,
          }),
        ],
      },
      limit: 20,
    });

    return res.json({ users: users.map((u) => applyPrivacy(u, false)) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la recherche.' });
  }
}

// GET /api/users/suggestions/list
async function getSuggestions(req, res) {
  try {
    const userId = req.user.id;
    const friendIds = await getFriendIdsFor(userId);
    const excludeIds = [userId, ...friendIds];

    const users = await User.findAll({
      where: { id: { [Op.notIn]: excludeIds } },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    return res.json({ users: users.map((u) => applyPrivacy(u, false)) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération des suggestions.' });
  }
}

// GET /api/users/:id
async function getUser(req, res) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    const friendIds = await getFriendIdsFor(req.user.id);
    return res.json({ user: applyPrivacy(user, friendIds.includes(user.id)) });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// PUT /api/users/me
async function updateProfile(req, res) {
  try {
    const { username, bio, password, wallpaper, profileVisibility, mediaAutoDownload } = req.body;
    const user = req.user;

    if (username && username !== user.username) {
      const taken = await User.findOne({ where: { username } });
      if (taken) return res.status(409).json({ message: "Ce nom d'utilisateur est déjà pris." });
      user.username = username;
    }

    if (typeof bio === 'string') user.bio = bio;

    if (wallpaper) user.wallpaper = wallpaper;

    if (profileVisibility && ['everyone', 'friends'].includes(profileVisibility)) {
      user.profileVisibility = profileVisibility;
    }

    if (typeof mediaAutoDownload !== 'undefined') {
      user.mediaAutoDownload = mediaAutoDownload === 'true' || mediaAutoDownload === true;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    if (req.file) {
      user.avatarUrl = await uploadFile(req.file, 'avatars');
    }

    await user.save();
    return res.json({ message: 'Profil mis à jour.', user: sanitize(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du profil.' });
  }
}

// GET /api/users/:id/profile — profil public complet (bio, amis, groupes, publications)
async function getUserProfile(req, res) {
  try {
    const target = await User.findByPk(req.params.id);
    if (!target) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const viewerId = req.user.id;
    const isSelf = target.id === viewerId;
    const viewerFriendIds = await getFriendIdsFor(viewerId);
    const isFriend = viewerFriendIds.includes(target.id);

    let relationship = 'none';
    if (isSelf) relationship = 'self';
    else if (isFriend) relationship = 'friends';
    else {
      const pending = await FriendRequest.findOne({
        where: {
          status: 'pending',
          [Op.or]: [
            { senderId: viewerId, receiverId: target.id },
            { senderId: target.id, receiverId: viewerId },
          ],
        },
      });
      if (pending) {
        relationship = pending.senderId === viewerId ? 'pending_sent' : 'pending_received';
      }
    }

    const targetFriendIds = await getFriendIdsFor(target.id);
    const friendCount = targetFriendIds.length;

    const memberships = await ConversationMember.findAll({ where: { userId: target.id } });
    const conversationIds = memberships.map((m) => m.conversationId);
    const conversations = await Conversation.findAll({
      where: { id: conversationIds, isGroup: true },
    });

    // Une seule requête groupée pour tous les membres de tous ces groupes,
    // au lieu de 2 requêtes séparées par groupe.
    const allMembersOfTheseGroups = await ConversationMember.findAll({
      where: { conversationId: conversations.map((c) => c.id) },
    });
    const memberCountMap = {};
    const viewerMemberSet = new Set();
    allMembersOfTheseGroups.forEach((m) => {
      memberCountMap[m.conversationId] = (memberCountMap[m.conversationId] || 0) + 1;
      if (m.userId === viewerId) viewerMemberSet.add(m.conversationId);
    });

    const groups = conversations.map((c) => ({
      id: c.id,
      name: c.name,
      avatarUrl: c.avatarUrl,
      memberCount: memberCountMap[c.id] || 0,
      createdByThisUser: c.createdBy === target.id,
      viewerIsMember: viewerMemberSet.has(c.id),
    }));

    const canViewPosts = isSelf || isFriend;
    let posts = [];
    if (canViewPosts) {
      const rawPosts = await Post.findAll({ where: { userId: target.id }, order: [['createdAt', 'DESC']], limit: 30 });
      const authorsMap = { [target.id]: applyPrivacy(target, isFriend) };
      posts = await enrichPostsBatch(rawPosts, viewerId, authorsMap);
    }

    return res.json({
      user: applyPrivacy(target, isFriend),
      relationship,
      friendCount,
      groups,
      canViewPosts,
      posts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération du profil.' });
  }
}

// GET /api/users/:id/friends-list — liste d'amis publique d'un profil
async function getUserFriendsList(req, res) {
  try {
    const targetId = req.params.id;
    const friendIds = await getFriendIdsFor(targetId);
    const friends = await User.findAll({ where: { id: friendIds } });
    return res.json({ friends: friends.map((f) => applyPrivacy(f, false)) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération des amis.' });
  }
}

module.exports = {
  searchUsers,
  getUser,
  updateProfile,
  getSuggestions,
  getUserProfile,
  getUserFriendsList,
};
