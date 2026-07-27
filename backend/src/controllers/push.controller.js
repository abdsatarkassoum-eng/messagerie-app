const { PushSubscription } = require('../models');

// GET /api/push/vapid-public-key
function getPublicKey(req, res) {
  return res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
}

// POST /api/push/subscribe { endpoint, keys: { p256dh, auth } }
async function subscribe(req, res) {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Données d\'abonnement invalides.' });
    }

    const existing = await PushSubscription.findOne({ where: { endpoint } });
    if (existing) {
      existing.userId = req.user.id;
      existing.p256dh = keys.p256dh;
      existing.auth = keys.auth;
      await existing.save();
    } else {
      await PushSubscription.create({
        userId: req.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
    }

    return res.status(201).json({ message: 'Abonnement enregistré.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur lors de l'enregistrement de l'abonnement." });
  }
}

// POST /api/push/unsubscribe { endpoint }
async function unsubscribe(req, res) {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await PushSubscription.destroy({ where: { endpoint, userId: req.user.id } });
    }
    return res.json({ message: 'Désabonné.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors du désabonnement.' });
  }
}

module.exports = { getPublicKey, subscribe, unsubscribe };
