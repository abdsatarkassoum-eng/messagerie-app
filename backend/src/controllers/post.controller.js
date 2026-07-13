const { Op } = require('sequelize');
const { Post, PostLike, PostComment, User, Friendship } = require('../models');
const { sanitize } = require('./auth.controller');
const uploadFile = require('../utils/uploadFile');

async function getFriendIds(userId) {
  const friendships = await Friendship.findAll({
    where: { [Op.or]: [{ userAId: userId }, { userBId: userId }] },
  });
  return friendships.map((f) => (f.userAId === userId ? f.userBId : f.userAId));
}

async function enrichPost(post, currentUserId, authorsMap) {
  const likesCount = await PostLike.count({ where: { postId: post.id } });
  const commentsCount = await PostComment.count({ where: { postId: post.id } });
  const likedByMe = !!(await PostLike.findOne({ where: { postId: post.id, userId: currentUserId } }));

  return {
    id: post.id,
    author: authorsMap[post.userId],
    content: post.content,
    fileUrl: post.fileUrl,
    type: post.type,
    createdAt: post.createdAt,
    likesCount,
    commentsCount,
    likedByMe,
    isMine: post.userId === currentUserId,
  };
}

// POST /api/posts { content }
async function createPost(req, res) {
  try {
    const { content } = req.body;
    let fileUrl = null;
    let type = 'text';

    if (req.file) {
      const folder = req.file.mimetype.startsWith('video/') ? 'videos' : 'images';
      fileUrl = await uploadFile(req.file, folder);
      type = folder === 'videos' ? 'video' : 'image';
    }

    if (!content?.trim() && !fileUrl) {
      return res.status(400).json({ message: 'La publication ne peut pas être vide.' });
    }

    const post = await Post.create({
      userId: req.user.id,
      content: content || null,
      fileUrl,
      type,
    });

    const authorsMap = { [req.user.id]: sanitize(req.user) };
    const enriched = await enrichPost(post, req.user.id, authorsMap);

    return res.status(201).json({ message: 'Publication créée.', post: enriched });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la publication.' });
  }
}

// GET /api/posts — publications de l'utilisateur et de ses amis
async function listFeed(req, res) {
  try {
    const userId = req.user.id;
    const friendIds = await getFriendIds(userId);
    const relevantIds = [userId, ...friendIds];

    const posts = await Post.findAll({
      where: { userId: relevantIds },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const authors = await User.findAll({ where: { id: relevantIds } });
    const authorsMap = Object.fromEntries(authors.map((a) => [a.id, sanitize(a)]));

    const enriched = await Promise.all(posts.map((p) => enrichPost(p, userId, authorsMap)));

    return res.json({ posts: enriched });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération du fil.' });
  }
}

// DELETE /api/posts/:id
async function deletePost(req, res) {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Publication introuvable.' });
    if (post.userId !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres publications.' });
    }

    await PostLike.destroy({ where: { postId: post.id } });
    await PostComment.destroy({ where: { postId: post.id } });
    await post.destroy();

    return res.json({ message: 'Publication supprimée.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
}

// POST /api/posts/:id/like — bascule j'aime / je n'aime plus
async function toggleLike(req, res) {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Publication introuvable.' });

    const existing = await PostLike.findOne({ where: { postId: post.id, userId: req.user.id } });
    if (existing) {
      await existing.destroy();
      return res.json({ liked: false });
    }

    await PostLike.create({ postId: post.id, userId: req.user.id });
    return res.json({ liked: true });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// GET /api/posts/:id/comments
async function listComments(req, res) {
  try {
    const comments = await PostComment.findAll({
      where: { postId: req.params.id },
      order: [['createdAt', 'ASC']],
    });

    const authorIds = [...new Set(comments.map((c) => c.userId))];
    const authors = await User.findAll({ where: { id: authorIds } });
    const authorsMap = Object.fromEntries(authors.map((a) => [a.id, sanitize(a)]));

    return res.json({
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: authorsMap[c.userId],
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des commentaires.' });
  }
}

// POST /api/posts/:id/comments { content }
async function addComment(req, res) {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Le commentaire ne peut pas être vide.' });

    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Publication introuvable.' });

    const comment = await PostComment.create({
      postId: post.id,
      userId: req.user.id,
      content: content.trim(),
    });

    return res.status(201).json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: sanitize(req.user),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur lors de l'ajout du commentaire." });
  }
}

module.exports = { createPost, listFeed, deletePost, toggleLike, listComments, addComment };
