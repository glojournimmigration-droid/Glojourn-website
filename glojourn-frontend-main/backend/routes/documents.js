const express = require('express');
const multer = require('multer');
const { body, param } = require('express-validator');
const { uploadDocument } = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5242880 // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// All routes require authentication
router.use(authenticateToken);

// Upload document
router.post('/upload', upload.single('file'), [
  body('application_id').isMongoId().withMessage('Invalid application ID'),
  body('document_type').optional().isString().withMessage('Invalid document type')
], uploadDocument);

module.exports = router;
