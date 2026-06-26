const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/auth.js');

// Config multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB file size limit
  }
});

// Protect all upload endpoints
router.use(authMiddleware);

router.post('/upload', upload.single('file'), uploadController.uploadFile);
router.get('/', uploadController.getUploads);

module.exports = router;
