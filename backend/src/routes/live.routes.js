const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { startLive, joinLive, endLive } = require('../controllers/live.controller');

router.post('/start', auth, startLive);
router.post('/:postId/join', auth, joinLive);
router.post('/:postId/end', auth, endLive);

module.exports = router;
