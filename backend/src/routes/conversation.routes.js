const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  listConversations,
  createOrGetPrivateConversation,
  getMessages,
  markAsRead,
} = require('../controllers/conversation.controller');

router.get('/', auth, listConversations);
router.post('/private', auth, createOrGetPrivateConversation);
router.get('/:id/messages', auth, getMessages);
router.post('/:id/read', auth, markAsRead);

module.exports = router;
