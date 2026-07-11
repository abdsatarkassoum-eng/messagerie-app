const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const {
  createInvitation,
  listInvitations,
  listJoinRequests,
  reviewJoinRequest,
  checkInvitation,
  submitJoinRequest,
  checkRequestStatus,
} = require('../controllers/invitation.controller');

// --- Public ---
router.get('/:token/check', checkInvitation);
router.post('/:token/request', submitJoinRequest);
router.get('/requests/:id/status', checkRequestStatus);

// --- Admin ---
router.post('/', auth, adminOnly, createInvitation);
router.get('/', auth, adminOnly, listInvitations);
router.get('/requests/all', auth, adminOnly, listJoinRequests);
router.post('/requests/:id/review', auth, adminOnly, reviewJoinRequest);

module.exports = router;
