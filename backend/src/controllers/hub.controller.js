const { Hub, Category, Conversation, ConversationMember } = require('../models');

// GET /api/hubs
async function listHubs(req, res) {
  try {
    const hubs = await Hub.findAll({ order: [['order', 'ASC']] });
    return res.json({ hubs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération des hubs.' });
  }
}

// GET /api/hubs/:hubId/categories
async function listCategories(req, res) {
  try {
    const { hubId } = req.params;
    const categories = await Category.findAll({ where: { hubId }, order: [['order', 'ASC']] });
    return res.json({ categories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération des catégories.' });
  }
}

// GET /api/hubs/categories/:categoryId/salons
async function listSalons(req, res) {
  try {
    const { categoryId } = req.params;
    const salons = await Conversation.findAll({
      where: { categoryId, isGroup: true, isPublic: true },
      order: [['createdAt', 'DESC']],
    });

    const salonIds = salons.map((s) => s.id);
    const allMembers = salonIds.length
      ? await ConversationMember.findAll({ where: { conversationId: salonIds } })
      : [];

    const countByConv = {};
    const myConvIds = new Set();
    allMembers.forEach((m) => {
      countByConv[m.conversationId] = (countByConv[m.conversationId] || 0) + 1;
      if (m.userId === req.user.id) myConvIds.add(m.conversationId);
    });

    return res.json({
      salons: salons.map((s) => ({
        id: s.id,
        name: s.name,
        avatarUrl: s.avatarUrl,
        memberCount: countByConv[s.id] || 0,
        isMember: myConvIds.has(s.id),
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la récupération des salons.' });
  }
}

// POST /api/hubs/categories/:categoryId/salons  { name }
async function createSalon(req, res) {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Le nom du salon est requis.' });
    }

    const category = await Category.findByPk(categoryId);
    if (!category) return res.status(404).json({ message: 'Catégorie introuvable.' });

    const salon = await Conversation.create({
      isGroup: true,
      isPublic: true,
      categoryId,
      name: name.trim(),
      createdBy: req.user.id,
    });

    await ConversationMember.create({
      conversationId: salon.id,
      userId: req.user.id,
      role: 'admin',
    });

    return res.status(201).json({ salon: { id: salon.id, name: salon.name, avatarUrl: salon.avatarUrl } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la création du salon.' });
  }
}

// POST /api/hubs/salons/:salonId/join
async function joinSalon(req, res) {
  try {
    const { salonId } = req.params;
    const salon = await Conversation.findByPk(salonId);
    if (!salon || !salon.isPublic) return res.status(404).json({ message: 'Salon introuvable.' });

    const existing = await ConversationMember.findOne({
      where: { conversationId: salonId, userId: req.user.id },
    });
    if (existing) return res.json({ conversationId: salonId, alreadyMember: true });

    await ConversationMember.create({
      conversationId: salonId,
      userId: req.user.id,
      role: 'member',
    });

    return res.json({ conversationId: salonId, alreadyMember: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur lors de l'adhésion au salon." });
  }
}

module.exports = { listHubs, listCategories, listSalons, createSalon, joinSalon };
