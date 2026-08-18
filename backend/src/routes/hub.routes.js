const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  listHubs,
  listCategories,
  listSalons,
  createSalon,
  joinSalon,
  getSalonSummary,
} = require('../controllers/hub.controller');

router.get('/', auth, listHubs);
router.get('/:hubId/categories', auth, listCategories);
router.get('/categories/:categoryId/salons', auth, listSalons);
router.post('/categories/:categoryId/salons', auth, createSalon);
router.post('/salons/:salonId/join', auth, joinSalon);
router.get('/salons/:salonId', auth, getSalonSummary);

module.exports = router;
