const crypto = require('crypto');
const { Invitation, JoinRequest, User } = require('../models');

const PAYMENT_ENABLED = process.env.PAYMENT_ENABLED === 'true';

function makeToken() {
  return crypto.randomBytes(24).toString('hex');
}

// ---------- Côté administrateur ----------

// POST /api/invitations { label, maxUses, expiresInDays }
async function createInvitation(req, res) {
  try {
    const { label, maxUses = 1, expiresInDays } = req.body;

    const expiresAt = expiresInDays
      ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000)
      : null;

    const invitation = await Invitation.create({
      token: makeToken(),
      createdBy: req.user.id,
      label: label || null,
      maxUses: Number(maxUses) || 1,
      expiresAt,
    });

    const inviteLink = `${process.env.CLIENT_URL}/join/${invitation.token}`;

    return res.status(201).json({ invitation, inviteLink });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur lors de la création de l'invitation." });
  }
}

// GET /api/invitations
async function listInvitations(req, res) {
  try {
    const invitations = await Invitation.findAll({ order: [['createdAt', 'DESC']] });
    return res.json({
      invitations: invitations.map((i) => ({
        ...i.toJSON(),
        inviteLink: `${process.env.CLIENT_URL}/join/${i.token}`,
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des invitations.' });
  }
}

// GET /api/invitations/requests?status=pending
async function listJoinRequests(req, res) {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const requests = await JoinRequest.findAll({ where, order: [['createdAt', 'DESC']] });
    return res.json({ requests });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des demandes.' });
  }
}

// POST /api/invitations/requests/:id/review { action: 'approve' | 'reject', requirePayment }
async function reviewJoinRequest(req, res) {
  try {
    const { id } = req.params;
    const { action, requirePayment } = req.body;

    const request = await JoinRequest.findByPk(id);
    if (!request) return res.status(404).json({ message: 'Demande introuvable.' });
    if (request.status !== 'pending') {
      return res.status(409).json({ message: 'Cette demande a déjà été traitée.' });
    }

    if (action === 'reject') {
      request.status = 'rejected';
      request.reviewedBy = req.user.id;
      await request.save();
      return res.json({ message: 'Demande refusée.' });
    }

    if (action === 'approve') {
      request.status = 'approved';
      request.reviewedBy = req.user.id;
      request.paymentRequired = PAYMENT_ENABLED && !!requirePayment;

      if (request.paymentRequired) {
        // Le lien d'inscription ne sera généré qu'après confirmation du paiement
        request.paymentStatus = 'pending';
        await request.save();
        return res.json({
          message: 'Demande approuvée. En attente du paiement avant envoi du lien d\'inscription.',
          paymentRequired: true,
        });
      }

      // Pas de paiement requis : le lien est généré immédiatement
      request.registrationToken = makeToken();
      await request.save();

      const registrationLink = `${process.env.CLIENT_URL}/register?token=${request.registrationToken}`;
      // Ici, on enverrait normalement un e-mail. On renvoie le lien à l'administrateur pour l'instant.
      return res.json({
        message: 'Demande approuvée. Lien d\'inscription généré.',
        registrationLink,
      });
    }

    return res.status(400).json({ message: 'Action invalide.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur lors du traitement de la demande.' });
  }
}

// ---------- Côté public ----------

// GET /api/invitations/:token/check
async function checkInvitation(req, res) {
  try {
    const invitation = await Invitation.findOne({ where: { token: req.params.token } });
    if (!invitation || !invitation.active) {
      return res.status(404).json({ valid: false, message: 'Invitation invalide.' });
    }
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return res.status(410).json({ valid: false, message: 'Cette invitation a expiré.' });
    }
    if (invitation.usesCount >= invitation.maxUses) {
      return res.status(410).json({ valid: false, message: "Cette invitation a atteint son nombre maximal d'utilisations." });
    }
    return res.json({ valid: true, label: invitation.label });
  } catch (err) {
    return res.status(500).json({ valid: false, message: 'Erreur serveur.' });
  }
}

// POST /api/invitations/:token/request { fullName, email, message }
async function submitJoinRequest(req, res) {
  try {
    const invitation = await Invitation.findOne({ where: { token: req.params.token } });
    if (!invitation || !invitation.active) {
      return res.status(404).json({ message: 'Invitation invalide.' });
    }
    if (invitation.usesCount >= invitation.maxUses) {
      return res.status(410).json({ message: "Cette invitation a atteint son nombre maximal d'utilisations." });
    }

    const { fullName, email, message } = req.body;
    if (!fullName || !email) {
      return res.status(400).json({ message: 'Nom complet et e-mail requis.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Un compte existe déjà avec cet e-mail.' });
    }

    const request = await JoinRequest.create({
      invitationId: invitation.id,
      fullName,
      email,
      message: message || null,
    });

    invitation.usesCount += 1;
    await invitation.save();

    return res.status(201).json({
      message: 'Votre demande a été envoyée. Vous recevrez un lien dès qu\'elle sera approuvée.',
      requestId: request.id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur lors de l'envoi de la demande." });
  }
}

// GET /api/invitations/requests/:id/status - permet au demandeur de suivre l'état
async function checkRequestStatus(req, res) {
  try {
    const request = await JoinRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Demande introuvable.' });

    return res.json({
      status: request.status,
      paymentRequired: request.paymentRequired,
      paymentStatus: request.paymentStatus,
      registrationLink:
        request.status === 'approved' &&
        (!request.paymentRequired || request.paymentStatus === 'paid') &&
        request.registrationToken
          ? `${process.env.CLIENT_URL}/register?token=${request.registrationToken}`
          : null,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = {
  createInvitation,
  listInvitations,
  listJoinRequests,
  reviewJoinRequest,
  checkInvitation,
  submitJoinRequest,
  checkRequestStatus,
  makeToken,
};
