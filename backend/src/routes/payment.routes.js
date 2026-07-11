const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { getConfig, initiatePayment, confirmPayment } = require('../controllers/payment.controller');

router.get('/config', getConfig);
router.post('/initiate', initiatePayment);
router.post('/confirm', auth, adminOnly, confirmPayment);

module.exports = router;
