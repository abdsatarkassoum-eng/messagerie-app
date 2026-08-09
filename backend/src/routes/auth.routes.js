const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { auth } = require('../middleware/auth');
const { register, login, googleAuth, forgotPassword, resetPassword, me, logout } = require('../controllers/auth.controller');

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', auth, me);
router.post('/logout', auth, logout);

module.exports = router;
