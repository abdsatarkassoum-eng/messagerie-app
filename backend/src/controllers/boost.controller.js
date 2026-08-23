const { CatalogItem } = require('../models');
const { createCheckoutTransaction, getTransactionStatus } = require('../utils/fedapay');

const BOOST_TARIFFS = {
  1: 500,
  3: 1300,
  7: 2800,
};

// POST /api/boost/initiate { itemId, days }
async function initiateBoost(req, res) {
  try {
    const { itemId, days } = req.body;
    const amount = BOOST_TARIFFS[days];
    if (!amount) return res.status(400).json({ message: 'Durée de boostage invalide.' });

    const item = await CatalogItem.findByPk(itemId);
    if (!item) return res.status(404).json({ message: 'Article introuvable.' });
    if (item.userId !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez booster que vos propres articles.' });
    }

    const { checkoutUrl, transactionId } = await createCheckoutTransaction({
      amount,
      description: `FriEnds — Boost "${item.name}" (${days} jour${days > 1 ? 's' : ''})`,
      customerEmail: req.user.email,
      customData: { itemId, userId: req.user.id, days, amount },
      callbackUrl: `${process.env.FRONTEND_URL}/marketplace`,
    });

    return res.json({ checkoutUrl, transactionId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Erreur lors de l'initiation du boostage." });
  }
}

// GET /api/boost/check/:transactionId
async function checkBoost(req, res) {
  try {
    const { transactionId } = req.params;
    const transaction = await getTransactionStatus(transactionId);

    if (transaction.status !== 'approved') {
      return res.json({ confirmed: false, status: transaction.status });
    }

    const { itemId, userId, days, amount } = transaction.custom_metadata || {};
    if (!userId || userId !== req.user.id) {
      return res.status(403).json({ message: 'Transaction non reconnue pour cet utilisateur.' });
    }

    const item = await CatalogItem.findByPk(itemId);
    if (!item) return res.status(404).json({ message: 'Article introuvable.' });

    item.boostedUntil = new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000);
    item.boostAmount = Number(amount);
    await item.save();

    return res.json({ confirmed: true, item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la vérification du boostage.' });
  }
}

module.exports = { initiateBoost, checkBoost, BOOST_TARIFFS };
