const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { initiateBoost, checkBoost } = require('../controllers/boost.controller');

router.post('/initiate', auth, initiateBoost);
router.get('/check/:transactionId', auth, checkBoost);

module.exports = router;
