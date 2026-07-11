const bcrypt = require('bcryptjs');
const { User } = require('../models');

// Crée automatiquement le compte administrateur au démarrage du serveur,
// s'il n'existe pas déjà. Utile sur les hébergements gratuits qui ne
// donnent pas accès à un Shell (ex: Render, offre gratuite).
async function ensureAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const username = process.env.ADMIN_USERNAME || 'admin';

    if (!email || !password) {
      console.log('ℹ️  ADMIN_EMAIL / ADMIN_PASSWORD non définis : création automatique de l\'admin ignorée.');
      return;
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`ℹ️  Compte administrateur déjà présent (${email}).`);
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email,
      password: hashed,
      isAdmin: true,
      isActive: true,
    });

    console.log(`✅ Compte administrateur créé automatiquement : ${email}`);
  } catch (err) {
    console.error('❌ Erreur lors de la création automatique du compte admin :', err);
  }
}

module.exports = ensureAdmin;
