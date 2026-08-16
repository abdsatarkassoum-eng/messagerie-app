const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { initiateVerification, checkVerification } = require('../controllers/subscription.controller');

router.post('/verified/initiate', auth, initiateVerification);
router.get('/verified/check/:transactionId', auth, checkVerification);

module.exports = router;
