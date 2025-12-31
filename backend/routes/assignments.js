const express = require('express');
const { body } = require('express-validator');
const { assignApplication } = require('../controllers/assignmentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and coordinator/manager/admin role
router.use(authenticateToken);
router.use(requireRole('admin', 'manager', 'coordinator'));

// Create assignment
router.post('/', [
  body('application_id').isMongoId().withMessage('Invalid application ID'),
  body('manager_id').isMongoId().withMessage('Invalid manager ID')
], assignApplication);

module.exports = router;
