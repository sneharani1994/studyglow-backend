const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const authMiddleware = require('../middleware/auth.js');

// Apply auth protection
router.use(authMiddleware);

router.get('/', quizController.getQuizzes);
router.post('/', quizController.createQuiz);
router.get('/attempts', quizController.getAttempts);
router.get('/leaderboard', quizController.getLeaderboard);
router.get('/:id', quizController.getQuizDetails);
router.post('/:id/attempt', quizController.attemptQuiz);

module.exports = router;
