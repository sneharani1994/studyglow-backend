const express = require('express');
const router = express.Router();
const plannerController = require('../controllers/plannerController');
const authMiddleware = require('../middleware/auth.js');

// Apply auth protection
router.use(authMiddleware);

router.get('/tasks', plannerController.getTasks);
router.post('/tasks', plannerController.createTask);
router.put('/tasks/:id', plannerController.updateTask);
router.delete('/tasks/:id', plannerController.deleteTask);

module.exports = router;
