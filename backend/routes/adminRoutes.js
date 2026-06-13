const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/adminController');
const { auth, isAdmin } = require('../middlewares/auth');

router.get('/admin/analytics', auth, isAdmin, getAnalytics);

module.exports = router;
