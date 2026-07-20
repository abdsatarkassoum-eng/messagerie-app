const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { auth } = require('../middleware/auth');
const { listByUser, createItem, deleteItem } = require('../controllers/catalog.controller');

router.get('/user/:id', auth, listByUser);
router.post('/', auth, upload.array('files', 6), createItem);
router.delete('/:id', auth, deleteItem);

module.exports = router;
