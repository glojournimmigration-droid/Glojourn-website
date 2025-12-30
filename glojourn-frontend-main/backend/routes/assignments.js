const express = require('express');
const { body } = require('express-validator');
const { createAssignment } = require('../controllers/assignmentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create assignment
router.post('/', [
  body('application_id').isMongoId().withMessage('Invalid application ID'),
  body('manager_id').isMongoId().withMessage('Invalid manager ID')
], createAssignment);

module.exports = router;
