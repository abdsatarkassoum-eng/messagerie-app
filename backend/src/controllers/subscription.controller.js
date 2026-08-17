const { User } = require('../models');
const { sanitize } = require('./auth.controller');
const { createCheckoutTransaction, getTransactionStatus } = require('../utils/fedapay');

const VERIFIED_PRICE_XOF = 1300;
const SUBSCRIPTION_DAYS = 30;

// POST /api/subscriptions/verified/initiate
async function initiateVerification(req, res) {
  try {
    const { checkoutUrl, transactionId } = await createCheckoutTransaction({
      amount: VERIFIED_PRICE_XOF,
      description: 'FriEnds — Badge vendeur vérifié (1 mois)',
      customerEmail: req.user.email,
      customData: { userId: req.user.id, purpose: 'verified_badge' },
      callbackUrl: `${process.env.FRONTEND_URL}/subscription/return`,
    });

    console.log('[VERIF] Transaction créée, id =', transactionId);
    return res.json({ checkoutUrl, transactionId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Erreur lors de l'initiation du paiement." });
  }
}

// GET /api/subscriptions/verified/check/:transactionId
async function checkVerification(req, res) {
  try {
    const { transactionId } = req.params;
    console.log('[VERIF] Appel check pour transactionId =', transactionId);

    const transaction = await getTransactionStatus(transactionId);
    console.log('[VERIF] Réponse FedaPay brute =', JSON.stringify(transaction));

    if (transaction.status !== 'approved') {
      console.log('[VERIF] Statut non reconnu comme approuvé. Statut reçu =', transaction.status);
      return res.json({ confirmed: false, status: transaction.status });
    }

    const userId = transaction.custom_data?.userId;
    console.log('[VERIF] userId dans custom_data =', userId, '| req.user.id =', req.user.id);

    if (!userId || userId !== req.user.id) {
      return res.status(403).json({ message: 'Transaction non reconnue pour cet utilisateur.' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const base = user.verifiedUntil && user.verifiedUntil > new Date() ? user.verifiedUntil : new Date();
    user.isVerified = true;
    user.verifiedUntil = new Date(base.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);
    await user.save();

    console.log('[VERIF] Badge vérifié activé pour userId =', userId);
    return res.json({ confirmed: true, user: sanitize(user) });
  } catch (err) {
    console.error('[VERIF] Erreur inattendue :', err);
    return res.status(500).json({ message: err.message || 'Erreur lors de la vérification du paiement.' });
  }
}

module.exports = { initiateVerification, checkVerification, VERIFIED_PRICE_XOF };
