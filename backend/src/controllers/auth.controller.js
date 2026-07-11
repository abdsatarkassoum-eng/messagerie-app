const bcrypt = require('bcryptjs');
const { User, JoinRequest } = require('../models');
const generateToken = require('../utils/generateToken');

const INVITE_ONLY = process.env.INVITE_ONLY === 'true';

// POST /api/auth/register
async function register(req, res) {
  try {
    const { username, email, password, registrationToken } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    // Si le mode "sur invitation" est activé, un token de validation est requis
    if (INVITE_ONLY) {
      if (!registrationToken) {
        return res.status(403).json({
          message:
            "L'inscription est réservée aux personnes invitées. Merci de faire une demande d'accès.",
        });
      }

      const joinRequest = await JoinRequest.findOne({
        where: { registrationToken },
      });

      if (!joinRequest || joinRequest.registrationTokenUsed) {
        return res.status(403).json({ message: 'Lien d\'inscription invalide ou déjà utilisé.' });
      }
      if (joinRequest.status !== 'approved') {
        return res.status(403).json({ message: "Votre demande n'a pas encore été approuvée." });
      }
      if (joinRequest.paymentRequired && joinRequest.paymentStatus !== 'paid') {
        return res.status(402).json({ message: 'Le paiement doit être finalisé avant l\'inscription.' });
      }

      req._joinRequest = joinRequest;
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ message: 'Cet e-mail est déjà utilisé.' });
    }
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ message: "Ce nom d'utilisateur est déjà pris." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const avatarUrl = req.file ? `/uploads/avatars/${req.file.filename}` : null;

    const user = await User.create({
      username,
      email,
      password: hashed,
      avatarUrl,
    });

    if (INVITE_ONLY && req._joinRequest) {
      req._joinRequest.registrationTokenUsed = true;
      await req._joinRequest.save();
    }

    const token = generateToken(user);

    return res.status(201).json({
      message: 'Compte créé avec succès.',
      token,
      user: sanitize(user),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur lors de l\'inscription.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail et mot de passe requis.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Ce compte a été désactivé.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user);
    return res.json({ token, user: sanitize(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
}

// GET /api/auth/me
async function me(req, res) {
  return res.json({ user: sanitize(req.user) });
}

// POST /api/auth/logout
async function logout(req, res) {
  try {
    req.user.status = 'offline';
    req.user.lastSeen = new Date();
    await req.user.save();
    return res.json({ message: 'Déconnecté avec succès.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors de la déconnexion.' });
  }
}

function sanitize(user) {
  const { id, username, email, avatarUrl, bio, status, lastSeen, isAdmin, createdAt } = user;
  return { id, username, email, avatarUrl, bio, status, lastSeen, isAdmin, createdAt };
}

module.exports = { register, login, me, logout, sanitize };
