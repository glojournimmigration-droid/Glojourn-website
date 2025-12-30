const express = require('express');
const { getAdminStats } = require('../controllers/adminController');
const { authenticateToken, requireAdminOrManagerOrCoordinator } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin/manager/coordinator access
router.use(authenticateToken);
router.use(requireAdminOrManagerOrCoordinator);

// Get admin statistics
router.get('/stats', getAdminStats);

module.exports = router;
