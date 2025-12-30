const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getApplications,
  getMyApplication,
  createApplication,
  updateApplication
} = require('../controllers/applicationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation rules
const applicationValidation = [
  body('personal_details.visa_type')
    .isIn(['tourist', 'business', 'student', 'work', 'family', 'other'])
    .withMessage('Invalid visa type'),
  body('personal_details.destination_country')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Destination country is required'),
  body('personal_details.purpose_of_visit')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Purpose of visit must be at least 10 characters'),
  body('personal_details.intended_date_of_entry')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('personal_details.intended_length_of_stay')
    .isInt({ min: 1, max: 365 })
    .withMessage('Length of stay must be between 1 and 365 days')
];

// Routes
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], getApplications);

router.get('/my-application', getMyApplication);

router.post('/', applicationValidation, createApplication);

router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid application ID'),
  ...applicationValidation
], updateApplication);

module.exports = router;
