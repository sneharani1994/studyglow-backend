const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const authMiddleware = require('../middleware/auth.js');

// Apply auth protection
router.use(authMiddleware);

router.get('/', searchController.globalSearch);

module.exports = router;
