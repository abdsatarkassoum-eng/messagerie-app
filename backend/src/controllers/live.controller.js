const { v4: uuidv4 } = require('uuid');
const { Post } = require('../models');
const { sanitize } = require('./auth.controller');
const { generateLiveKitToken } = require('../utils/livekit');
const { enrichPost } = require('./post.controller');

function isCurrentlyVerified(user) {
  return !!user.isVerified && !!user.verifiedUntil && new Date(user.verifiedUntil) > new Date();
}

// POST /api/live/start { title }
async function startLive(req, res) {
  try {
    if (!isCurrentlyVerified(req.user)) {
      return res.status(403).json({ message: 'Le live est réservé aux vendeurs vérifiés.' });
    }

    const { title } = req.body;
    const roomName = `live-${uuidv4()}`;

    const post = await Post.create({
      userId: req.user.id,
      content: title?.trim() || null,
      type: 'live',
      roomName,
      isLive: true,
    });

    const authorsMap = { [req.user.id]: sanitize(req.user) };
    const enriched = await enrichPost(post, req.user.id, authorsMap);

    const token = await generateLiveKitToken({
      identity: req.user.id,
      name: req.user.username,
      room: roomName,
      canPublish: true,
    });

    return res.status(201).json({ post: enriched, token, url: process.env.LIVEKIT_URL });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors du démarrage du live.' });
  }
}

// POST /api/live/:postId/join
async function joinLive(req, res) {
  try {
    const post = await Post.findByPk(req.params.postId);
    if (!post || post.type !== 'live' || !post.isLive) {
      return res.status(404).json({ message: 'Ce live est terminé ou introuvable.' });
    }

    const token = await generateLiveKitToken({
      identity: req.user.id,
      name: req.user.username,
      room: post.roomName,
      canPublish: post.userId === req.user.id,
    });

    return res.json({
      token,
      url: process.env.LIVEKIT_URL,
      roomName: post.roomName,
      isHost: post.userId === req.user.id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la connexion au live.' });
  }
}

// POST /api/live/:postId/end
async function endLive(req, res) {
  try {
    const post = await Post.findByPk(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Live introuvable.' });
    if (post.userId !== req.user.id) {
      return res.status(403).json({ message: "Seul l'hôte peut terminer le live." });
    }
    post.isLive = false;
    await post.save();
    return res.json({ message: 'Live terminé.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors de la fin du live.' });
  }
}

module.exports = { startLive, joinLive, endLive };
