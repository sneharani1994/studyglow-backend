const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const authMiddleware = require('../middleware/auth.js');

// Apply auth protection
router.use(authMiddleware);

router.get('/', notesController.getNotes);
router.post('/', notesController.createNote);

router.get('/subjects', notesController.getSubjects);
router.post('/subjects', notesController.createSubject);

router.get('/folders', notesController.getFolders);
router.post('/folders', notesController.createFolder);

router.get('/tags', notesController.getTags);

router.get('/:id', notesController.getNote);
router.put('/:id', notesController.updateNote);
router.delete('/:id', notesController.deleteNote);

module.exports = router;
