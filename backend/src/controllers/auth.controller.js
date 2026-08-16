const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { User, JoinRequest } = require('../models');
const generateToken = require('../utils/generateToken');
const uploadFile = require('../utils/uploadFile');
const { sendResetPasswordEmail } = require('../utils/mailer');

const INVITE_ONLY = process.env.INVITE_ONLY === 'true';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    const avatarUrl = req.file ? await uploadFile(req.file, 'avatars') : null;

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
    if (!user || !user.password) {
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

// POST /api/auth/google
async function googleAuth(req, res) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Jeton Google manquant.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ where: { googleId } });

    if (!user) {
      user = await User.findOne({ where: { email } });
      if (user) {
        user.googleId = googleId;
        await user.save();
      } else {
        let username = (name || email.split('@')[0]).replace(/\s+/g, '').toLowerCase();
        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) {
          username = `${username}${Math.floor(Math.random() * 10000)}`;
        }
        user = await User.create({
          username,
          email,
          googleId,
          avatarUrl: picture || null,
        });
      }
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Ce compte a été désactivé.' });
    }

    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user);
    return res.json({ token, user: sanitize(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Connexion avec Google impossible.' });
  }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'E-mail requis.' });
    }

    const user = await User.findOne({ where: { email } });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.resetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;
      await sendResetPasswordEmail(user.email, resetLink);
    }

    return res.json({
      message: 'Si un compte existe avec cet e-mail, un lien de réinitialisation a été envoyé.',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Jeton et nouveau mot de passe requis.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ where: { resetToken: hashedToken } });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ message: 'Lien de réinitialisation invalide ou expiré.' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
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

function parsePreview(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function sanitize(user) {
  const {
    id, username, email, avatarUrl, bio, status, lastSeen, isAdmin, createdAt,
    wallpaper, profileVisibility, mediaAutoDownload, productsLink, servicesLink,
    productsLinkPreview, servicesLinkPreview, isVerified, verifiedUntil,
  } = user;
  return {
    id, username, email, avatarUrl, bio, status, lastSeen, isAdmin, createdAt,
    wallpaper, profileVisibility, mediaAutoDownload, productsLink, servicesLink,
    productsLinkPreview: parsePreview(productsLinkPreview),
    servicesLinkPreview: parsePreview(servicesLinkPreview),
    isVerified, verifiedUntil,
  };
}

module.exports = { register, login, googleAuth, forgotPassword, resetPassword, me, logout, sanitize };
