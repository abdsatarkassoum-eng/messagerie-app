const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { auth } = require('../middleware/auth');
const { sendMessage, deleteMessage, markSeen } = require('../controllers/message.controller');

router.post('/', auth, upload.single('file'), sendMessage);
router.delete('/:id', auth, deleteMessage);
router.post('/:id/seen', auth, markSeen);

module.exports = router;
