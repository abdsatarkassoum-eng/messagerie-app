 const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { auth } = require('../middleware/auth');
const { searchUsers, getUser, updateProfile, getSuggestions } = require('../controllers/user.controller');

router.get('/search', auth, searchUsers);
router.get('/suggestions/list', auth, getSuggestions);
router.put('/me', auth, upload.single('avatar'), updateProfile);
router.get('/:id', auth, getUser);

module.exports = router;
