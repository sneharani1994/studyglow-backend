const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/auth.js');

// Apply auth protection to all profile endpoints
router.use(authMiddleware);

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.put('/password', profileController.updatePassword);
router.delete('/', profileController.deleteAccount);

module.exports = router;
