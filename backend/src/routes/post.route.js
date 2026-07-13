const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { auth } = require('../middleware/auth');
const {
  createPost,
  listFeed,
  deletePost,
  toggleLike,
  listComments,
  addComment,
} = require('../controllers/post.controller');

router.get('/', auth, listFeed);
router.post('/', auth, upload.single('file'), createPost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, toggleLike);
router.get('/:id/comments', auth, listComments);
router.post('/:id/comments', auth, addComment);

module.exports = router;
