const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth.js');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);
router.get('/session', authMiddleware, authController.getSession);
router.get('/google', authController.googleLogin);

module.exports = router;
