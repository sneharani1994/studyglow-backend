const express = require('express');
const router = express.Router();
const flashcardController = require('../controllers/flashcardController');
const authMiddleware = require('../middleware/auth.js');

// Apply auth protection
router.use(authMiddleware);

router.get('/', flashcardController.getFlashcards);
router.post('/', flashcardController.createFlashcard);
router.put('/:id', flashcardController.updateFlashcard);
router.delete('/:id', flashcardController.deleteFlashcard);
router.post('/:id/review', flashcardController.reviewFlashcard);

module.exports = router;
