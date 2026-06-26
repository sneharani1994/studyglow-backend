const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth.js');

// Apply auth protection
router.use(authMiddleware);

router.get('/sessions', chatController.getSessions);
router.post('/sessions', chatController.createSession);
router.put('/sessions/:id', chatController.updateSession);
router.delete('/sessions/:id', chatController.deleteSession);
router.get('/sessions/:id/messages', chatController.getMessages);
router.post('/sessions/:id/messages', chatController.sendMessage);

module.exports = router;
