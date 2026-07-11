const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  sendRequest,
  respondRequest,
  listRequests,
  listFriends,
  removeFriend,
} = require('../controllers/friend.controller');

router.get('/', auth, listFriends);
router.get('/requests', auth, listRequests);
router.post('/request', auth, sendRequest);
router.post('/respond', auth, respondRequest);
router.delete('/:friendId', auth, removeFriend);

module.exports = router;
