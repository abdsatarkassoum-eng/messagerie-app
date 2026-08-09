const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { logCall } = require('../controllers/call.controller');

router.post('/log', auth, logCall);

module.exports = router;
