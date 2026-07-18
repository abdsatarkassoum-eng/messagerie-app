const { CatalogItem } = require('../models');
const uploadFile = require('../utils/uploadFile');

// GET /api/catalog/user/:id?type=product|service
async function listByUser(req, res) {
  try {
    const where = { userId: req.params.id };
    if (req.query.type && ['product', 'service'].includes(req.query.type)) {
      where.type = req.query.type;
    }

    const items = await CatalogItem.findAll({ where, order: [['createdAt', 'DESC']] });
    return res.json({ items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération du catalogue.' });
  }
}

// POST /api/catalog { type, name, description, price }
async function createItem(req, res) {
  try {
    const { type, name, description, price } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Le nom est requis.' });
    if (!['product', 'service'].includes(type)) {
      return res.status(400).json({ message: 'Type invalide.' });
    }

    let fileUrl = null;
    if (req.file) {
      fileUrl = await uploadFile(req.file, 'catalog');
    }

    const item = await CatalogItem.create({
      userId: req.user.id,
      type,
      name: name.trim(),
      description: description || null,
      price: price || null,
      fileUrl,
    });

    return res.status(201).json({ item });
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

module.exports = { listByUser, createItem, deleteItem };
