const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { auth } = require('../middleware/auth');
const {
  createGroup,
  addMember,
  removeMember,
  changeRole,
  updateGroup,
} = require('../controllers/group.controller');

router.post('/', auth, upload.single('avatar'), createGroup);
router.put('/:id', auth, upload.single('avatar'), updateGroup);
router.post('/:id/members', auth, addMember);
router.delete('/:id/members/:userId', auth, removeMember);
router.put('/:id/members/:userId/role', auth, changeRole);

module.exports = router;
