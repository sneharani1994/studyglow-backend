const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth.js');

// Apply auth protection
router.use(authMiddleware);

router.post('/summarize', aiController.summarizeNotes);
router.post('/explain', aiController.explainTopic);
router.post('/generate-quiz', aiController.generateQuiz);
router.post('/generate-flashcards', aiController.generateFlashcards);
router.post('/generate-study-notes', aiController.generateStudyNotes);
router.post('/homework-solver', aiController.homeworkSolver);
router.post('/doubt-solver', aiController.doubtSolver);
router.post('/roadmap', aiController.roadmapGenerator);
router.post('/planner-generator', aiController.plannerGenerator);
router.post('/essay', aiController.essayGenerator);
router.post('/grammar', aiController.grammarChecker);
router.post('/code-explanation', aiController.codeExplanation);
router.post('/coding-assistant', aiController.codingAssistant);
router.post('/exam-predictor', aiController.examPredictor);
router.get('/history', aiController.getHistory);

module.exports = router;
