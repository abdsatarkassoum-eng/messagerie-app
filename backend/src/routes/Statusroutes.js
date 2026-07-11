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
} = require('../controllers/status.controller');

router.get('/', auth, listStatuses);
router.post('/', auth, upload.single('file'), createStatus);
router.post('/:id/view', auth, viewStatus);
router.get('/:id/viewers', auth, getViewers);
router.delete('/:id', auth, deleteStatus);

module.exports = router;
