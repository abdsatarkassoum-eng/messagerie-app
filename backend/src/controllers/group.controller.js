const { Conversation, ConversationMember, User } = require('../models');
const { sanitize } = require('./auth.controller');

// POST /api/groups { name, memberIds: [] }
async function createGroup(req, res) {
  try {
    const { name, memberIds = [] } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Le nom du groupe est requis.' });
    }

    const avatarUrl = req.file ? `/uploads/images/${req.file.filename}` : null;

    const group = await Conversation.create({
      isGroup: true,
      name: name.trim(),
      avatarUrl,
      createdBy: req.user.id,
    });

    const uniqueMemberIds = Array.from(new Set([...memberIds, req.user.id]));

    await ConversationMember.bulkCreate(
      uniqueMemberIds.map((userId) => ({
        conversationId: group.id,
        userId,
        role: userId === req.user.id ? 'admin' : 'member',
      }))
    );

    return res.status(201).json({ message: 'Groupe créé.', conversationId: group.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors de la création du groupe.' });
  }
}

async function assertAdmin(conversationId, userId) {
  const member = await ConversationMember.findOne({ where: { conversationId, userId } });
  return member && member.role === 'admin' ? member : null;
}

// POST /api/groups/:id/members { userId }
async function addMember(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const admin = await assertAdmin(id, req.user.id);
    if (!admin) return res.status(403).json({ message: 'Seuls les administrateurs peuvent ajouter des membres.' });

    const already = await ConversationMember.findOne({ where: { conversationId: id, userId } });
    if (already) return res.status(409).json({ message: 'Cet utilisateur est déjà membre.' });

    await ConversationMember.create({ conversationId: id, userId, role: 'member' });

    req.app.get('io')?.to(`conversation:${id}`).emit('group:member_added', { conversationId: id, userId });

    return res.status(201).json({ message: 'Membre ajouté.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur lors de l'ajout du membre." });
  }
}

// DELETE /api/groups/:id/members/:userId
async function removeMember(req, res) {
  try {
    const { id, userId } = req.params;
    const admin = await assertAdmin(id, req.user.id);
    const isSelf = req.user.id === userId;

    if (!admin && !isSelf) {
      return res.status(403).json({ message: 'Action non autorisée.' });
    }

    await ConversationMember.destroy({ where: { conversationId: id, userId } });

    req.app.get('io')?.to(`conversation:${id}`).emit('group:member_removed', { conversationId: id, userId });

    return res.json({ message: isSelf ? 'Vous avez quitté le groupe.' : 'Membre retiré.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors du retrait du membre.' });
  }
}

// PUT /api/groups/:id/members/:userId/role { role }
async function changeRole(req, res) {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    const admin = await assertAdmin(id, req.user.id);
    if (!admin) return res.status(403).json({ message: 'Seuls les administrateurs peuvent modifier les rôles.' });
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide.' });
    }

    const member = await ConversationMember.findOne({ where: { conversationId: id, userId } });
    if (!member) return res.status(404).json({ message: 'Membre introuvable.' });

    member.role = role;
    await member.save();

    return res.json({ message: 'Rôle mis à jour.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du rôle.' });
  }
}

// PUT /api/groups/:id { name }
async function updateGroup(req, res) {
  try {
    const { id } = req.params;
    const admin = await assertAdmin(id, req.user.id);
    if (!admin) return res.status(403).json({ message: 'Seuls les administrateurs peuvent modifier le groupe.' });

    const group = await Conversation.findByPk(id);
    if (!group) return res.status(404).json({ message: 'Groupe introuvable.' });

    if (req.body.name) group.name = req.body.name.trim();
    if (req.file) group.avatarUrl = `/uploads/images/${req.file.filename}`;
    await group.save();

    return res.json({ message: 'Groupe mis à jour.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du groupe.' });
  }
}

module.exports = { createGroup, addMember, removeMember, changeRole, updateGroup };
