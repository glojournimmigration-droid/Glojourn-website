const express = require('express');
const multer = require('multer');
const { body, param } = require('express-validator');
const { uploadDocument, getDocumentsForApplication } = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/auth');
const env = require('../config/env');

const router = express.Router();

// Configure multer for in-memory file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_BYTES
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = env.ALLOWED_FILE_TYPES;
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
const allowedDocTypes = [
  'passport',
  'visas',
  'work_permits',
  'certificates',
  'prior_applications',
  'tax_financials',
  'id_proof',
  'financial',
  'educational',
  'other',
  'client_upload'
];

router.post('/upload', upload.single('file'), [
  body('application_id').isMongoId().withMessage('Invalid application ID'),
  body('document_type').optional().isIn(allowedDocTypes).withMessage('Invalid document type')
], uploadDocument);

router.get('/application/:applicationId', [
  param('applicationId').isMongoId().withMessage('Invalid application ID')
], getDocumentsForApplication);

module.exports = router;
