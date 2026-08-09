const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { listNotifications, markAllRead, markOneRead } = require('../controllers/notification.controller');

router.get('/', auth, listNotifications);
router.post('/read-all', auth, markAllRead);
router.post('/:id/read', auth, markOneRead);

module.exports = router;
