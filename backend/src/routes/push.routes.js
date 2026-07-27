const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getPublicKey, subscribe, unsubscribe } = require('../controllers/push.controller');

router.get('/vapid-public-key', getPublicKey);
router.post('/subscribe', auth, subscribe);
router.post('/unsubscribe', auth, unsubscribe);

module.exports = router;
