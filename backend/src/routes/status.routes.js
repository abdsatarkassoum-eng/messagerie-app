 const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { auth } = require('../middleware/auth');
const {
  createStatus,
  listStatuses,
  viewStatus,
  getViewers,
  deleteStatus,
  toggleStatusLike,
  listStatusComments,
  addStatusComment,
} = require('../controllers/status.controller');

router.get('/', auth, listStatuses);
router.post('/', auth, upload.single('file'), createStatus);
router.post('/:id/view', auth, viewStatus);
router.get('/:id/viewers', auth, getViewers);
router.delete('/:id', auth, deleteStatus);
router.post('/:id/like', auth, toggleStatusLike);
router.get('/:id/comments', auth, listStatusComments);
router.post('/:id/comments', auth, addStatusComment);

module.exports = router;
