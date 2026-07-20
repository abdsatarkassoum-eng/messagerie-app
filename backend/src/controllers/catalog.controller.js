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
  // Compatibilité : anciens articles créés avec une seule photo (fileUrl)
  if (images.length === 0 && json.fileUrl) images = [json.fileUrl];
  return { ...json, images };
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

// POST /api/catalog { type, name, description, price } + fichiers "files" (jusqu'à 6)
async function createItem(req, res) {
  try {
    const { type, name, description, price } = req.body;
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

module.exports = { listByUser, createItem, deleteItem };
