const { JoinRequest } = require('../models');
const { makeToken } = require('./invitation.controller');

const PAYMENT_ENABLED = process.env.PAYMENT_ENABLED === 'true';
const PROVIDER = process.env.PAYMENT_PROVIDER || 'stripe';

// GET /api/payments/config - infos publiques pour le frontend
function getConfig(req, res) {
  return res.json({
    enabled: PAYMENT_ENABLED,
    provider: PROVIDER,
  });
}

// POST /api/payments/initiate { requestId }
// Crée une intention de paiement. Ceci est un squelette prêt à être branché
// sur Stripe / PayPal / Mobile Money selon PAYMENT_PROVIDER.
async function initiatePayment(req, res) {
  try {
    if (!PAYMENT_ENABLED) {
      return res.status(400).json({ message: 'Le module de paiement est désactivé.' });
    }

    const { requestId } = req.body;
    const request = await JoinRequest.findByPk(requestId);
    if (!request) return res.status(404).json({ message: 'Demande introuvable.' });
    if (!request.paymentRequired) {
      return res.status(400).json({ message: 'Aucun paiement requis pour cette demande.' });
    }

    // --- Exemple d'intégration Stripe (à compléter avec votre clé secrète) ---
    if (PROVIDER === 'stripe') {
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // const session = await stripe.checkout.sessions.create({ ... });
      // return res.json({ checkoutUrl: session.url });
      return res.json({
        message: 'Intégration Stripe à finaliser avec votre clé API.',
        checkoutUrl: null,
      });
    }

    if (PROVIDER === 'paypal') {
      return res.json({
        message: 'Intégration PayPal à finaliser avec vos identifiants API.',
        checkoutUrl: null,
      });
    }

    if (PROVIDER === 'mobilemoney') {
      return res.json({
        message: 'Intégration Mobile Money à finaliser avec votre agrégateur (ex: Kkiapay, Fedapay, CinetPay).',
        checkoutUrl: null,
      });
    }

    return res.status(400).json({ message: 'Fournisseur de paiement inconnu.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur lors de l'initiation du paiement." });
  }
}

// POST /api/payments/confirm { requestId, reference }
// À appeler par le webhook du fournisseur de paiement (ou manuellement par l'admin en test).
async function confirmPayment(req, res) {
  try {
    const { requestId, reference } = req.body;
    const request = await JoinRequest.findByPk(requestId);
    if (!request) return res.status(404).json({ message: 'Demande introuvable.' });

    request.paymentStatus = 'paid';
    request.paymentReference = reference || 'MANUAL_CONFIRMATION';
    request.registrationToken = makeToken();
    await request.save();

    const registrationLink = `${process.env.CLIENT_URL}/register?token=${request.registrationToken}`;

    return res.json({
      message: 'Paiement confirmé. Lien d\'inscription généré.',
      registrationLink,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la confirmation du paiement.' });
  }
}

module.exports = { getConfig, initiatePayment, confirmPayment };
