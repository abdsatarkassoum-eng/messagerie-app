const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models');
const { sanitize } = require('./auth.controller');

// GET /api/users/search?q=
async function searchUsers(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ users: [] });

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: req.user.id },
        [Op.or]: [
          { username: { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } },
        ],
      },
      limit: 20,
    });

    return res.json({ users: users.map(sanitize) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la recherche.' });
  }
}

// GET /api/users/:id
async function getUser(req, res) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    return res.json({ user: sanitize(user) });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// PUT /api/users/me
async function updateProfile(req, res) {
  try {
    const { username, bio, password } = req.body;
    const user = req.user;

    if (username && username !== user.username) {
      const taken = await User.findOne({ where: { username } });
      if (taken) return res.status(409).json({ message: "Ce nom d'utilisateur est déjà pris." });
      user.username = username;
    }

    if (typeof bio === 'string') user.bio = bio;

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    if (req.file) {
      user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();
    return res.json({ message: 'Profil mis à jour.', user: sanitize(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du profil.' });
  }
}

module.exports = { searchUsers, getUser, updateProfile };
