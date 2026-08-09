const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendResetPasswordEmail(to, resetLink) {
  await transporter.sendMail({
    from: `"FriEnds" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Réinitialisation de votre mot de passe FriEnds',
    html: `
      <p>Bonjour,</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe sur FriEnds.</p>
      <p><a href="${resetLink}">Cliquez ici pour choisir un nouveau mot de passe</a></p>
      <p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
    `,
  });
}

module.exports = { sendResetPasswordEmail };
