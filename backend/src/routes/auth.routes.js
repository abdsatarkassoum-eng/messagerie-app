const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { auth } = require('../middleware/auth');
const { register, login, me, logout } = require('../controllers/auth.controller');

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);
router.get('/me', auth, me);
router.post('/logout', auth, logout);

module.exports = router;
