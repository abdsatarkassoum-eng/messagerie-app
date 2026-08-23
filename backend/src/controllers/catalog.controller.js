const { Op } = require('sequelize');
const { CatalogItem, User } = require('../models');
const { sanitize } = require('./auth.controller');
const uploadFile = require('../utils/uploadFile');

function withParsedImages(item) {
  const json = item.toJSON ? item.toJSON() : item;
  let images = [];
  try {
    images = JSON.parse(json.images || '[]');
  } catch {
    images = [];
  }
  if (images.length === 0 && json.fileUrl) images = [json.fileUrl];
  const isBoosted = !!(json.boostedUntil && new Date(json.boostedUntil) > new Date());
  return { ...json, images, isBoosted };
}

// GET /api/catalog/user/:id?type=product|service
async function listByUser(req, res) {
  try {
    const where = { userId: req.params.id };
    if (req.query.type && ['product', 'service'].includes(req.query.type)) {
      where.type = req.query.type;
    }

    const items = await CatalogItem.findAll({ where, order: [['createdAt', 'DESC']] });
    const owner = await User.findByPk(req.params.id);

    return res.json({
      items: items.map(withParsedImages),
      seller: owner ? sanitize(owner) : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération du catalogue.' });
  }
}

// GET /api/catalog?type=product|service&search=... — marketplace globale, tous vendeurs mélangés,
// produits boostés en premier (triés par montant payé), puis les autres par date
async function listMarketplace(req, res) {
  try {
    const where = {};
    if (req.query.type && ['product', 'service'].includes(req.query.type)) {
      where.type = req.query.type;
    }
    if (req.query.search && req.query.search.trim()) {
      where.name = { [Op.iLike]: `%${req.query.search.trim()}%` };
    }

    const items = await CatalogItem.findAll({ where, limit: 120 });
    const now = new Date();

    const boosted = items.filter((i) => i.boostedUntil && new Date(i.boostedUntil) > now);
    const regular = items.filter((i) => !i.boostedUntil || new Date(i.boostedUntil) <= now);

    boosted.sort((a, b) => b.boostAmount - a.boostAmount);
    regular.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const ordered = [...boosted, ...regular];

    const userIds = [...new Set(ordered.map((i) => i.userId))];
    const owners = await User.findAll({ where: { id: userIds } });
    const ownersMap = Object.fromEntries(owners.map((o) => [o.id, sanitize(o)]));

    return res.json({
      items: ordered.map((i) => ({ ...withParsedImages(i), owner: ownersMap[i.userId] || null })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération de la marketplace.' });
  }
}

// POST /api/catalog { type, name, description, price, saleLink } + fichiers "files" (jusqu'à 6)
async function createItem(req, res) {
  try {
    const { type, name, description, price, saleLink } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Le nom est requis.' });
    if (!['product', 'service'].includes(type)) {
      return res.status(400).json({ message: 'Type invalide.' });
    }

    const files = req.files || [];
    const uploadedUrls = [];
    for (const file of files.slice(0, 6)) {
      const url = await uploadFile(file, 'catalog');
      uploadedUrls.push(url);
    }

    const item = await CatalogItem.create({
      userId: req.user.id,
      type,
      name: name.trim(),
      description: description || null,
      price: price || null,
      fileUrl: uploadedUrls[0] || null,
      images: JSON.stringify(uploadedUrls),
      saleLink: saleLink?.trim() || null,
    });

    return res.status(201).json({ item: withParsedImages(item) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur lors de la création de l'article." });
  }
}

// DELETE /api/catalog/:id
async function deleteItem(req, res) {
  try {
    const item = await CatalogItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Article introuvable.' });
    if (item.userId !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres articles.' });
    }
    await item.destroy();
    return res.json({ message: 'Article supprimé.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
}

module.exports = { listByUser, listMarketplace, createItem, deleteItem };
