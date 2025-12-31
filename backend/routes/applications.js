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
  body('visaType')
    .isIn(['tourist', 'business', 'student', 'work', 'family', 'other'])
    .withMessage('Invalid visa type'),
  body('intakeForm.generalInformation.fullLegalName')
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full legal name is required'),
  body('intakeForm.generalInformation.dateOfBirth')
    .isISO8601()
    .withMessage('Date of birth is required and must be a valid date'),
  body('intakeForm.generalInformation.birthCityCountry')
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage('City and country of birth are required'),
  body('intakeForm.generalInformation.citizenshipCountries')
    .isArray({ min: 1 })
    .withMessage('At least one citizenship country is required'),
  body('intakeForm.generalInformation.email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('intakeForm.generalInformation.address.city')
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('City is required'),
  body('intakeForm.generalInformation.address.state')
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('State is required'),
  body('intakeForm.generalInformation.address.zip')
    .isString()
    .trim()
    .isLength({ min: 3 })
    .withMessage('ZIP is required'),
  body('intakeForm.generalInformation.address.country')
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Country is required'),
  body('intakeForm.consultation.purposes')
    .isArray({ min: 1 })
    .withMessage('Select at least one purpose'),
  body('intakeForm.acknowledgment.agreed')
    .isBoolean()
    .custom((val) => val === true)
    .withMessage('Acknowledgment is required'),
  body('applicationDetails.destinationCountry')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Destination country must be at least 2 characters'),
  body('applicationDetails.purposeOfVisit')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Purpose of visit must be at least 10 characters'),
  body('applicationDetails.intendedDateOfEntry')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('applicationDetails.intendedLengthOfStay')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Length of stay must be between 1 and 365 days'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level')
];

const updateApplicationValidation = [
  param('id').isMongoId().withMessage('Invalid application ID'),
  body('visaType')
    .optional()
    .isIn(['tourist', 'business', 'student', 'work', 'family', 'other'])
    .withMessage('Invalid visa type'),
  body('intakeForm.generalInformation.fullLegalName')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full legal name is required'),
  body('intakeForm.generalInformation.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('intakeForm.generalInformation.birthCityCountry')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage('City and country of birth are required'),
  body('intakeForm.generalInformation.citizenshipCountries')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one citizenship country is required'),
  body('intakeForm.generalInformation.email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  body('intakeForm.consultation.purposes')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Select at least one purpose'),
  body('intakeForm.acknowledgment.agreed')
    .optional()
    .isBoolean()
    .withMessage('Acknowledgment is required'),
  body('applicationDetails.destinationCountry')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Destination country must be at least 2 characters'),
  body('applicationDetails.purposeOfVisit')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Purpose of visit must be at least 10 characters'),
  body('applicationDetails.intendedDateOfEntry')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('applicationDetails.intendedLengthOfStay')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Length of stay must be between 1 and 365 days'),
  body('status').optional().isIn(['draft', 'submitted', 'under_review', 'processing', 'approved', 'rejected', 'completed']).withMessage('Invalid status'),
  body('assignedCoordinator').optional().isMongoId().withMessage('Invalid coordinator ID'),
  body('assignedManager').optional().isMongoId().withMessage('Invalid manager ID'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level')
];

// Routes
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['draft', 'submitted', 'under_review', 'processing', 'approved', 'rejected', 'completed']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
], getApplications);

router.get('/my-application', getMyApplication);

router.post('/', applicationValidation, createApplication);

router.put('/:id', updateApplicationValidation, updateApplication);

module.exports = router;
