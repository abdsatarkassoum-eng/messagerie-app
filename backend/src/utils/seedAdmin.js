require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, syncDatabase } = require('../models');

(async () => {
  try {
    await syncDatabase();

    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'ChangeMoi123!';

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`ℹ️  Un utilisateur avec l'e-mail ${email} existe déjà.`);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      password: hashed,
      isAdmin: true,
      isActive: true,
    });

    console.log('✅ Compte administrateur créé avec succès :');
    console.log(`   Utilisateur : ${username}`);
    console.log(`   E-mail      : ${email}`);
    console.log(`   Mot de passe: ${password}`);
    console.log('⚠️  Pensez à changer ce mot de passe après la première connexion.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de la création du compte admin :', err);
    process.exit(1);
  }
})();
