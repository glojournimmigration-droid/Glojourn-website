const express = require('express');
const { body } = require('express-validator');
const { requestDocument } = require('../controllers/documentController'); // Need to implement this
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Only managers and admins can request documents
router.post('/', [
    requireRole('manager', 'admin', 'coordinator'),
    body('application_id').isMongoId().withMessage('Invalid application ID'),
    body('document_type').notEmpty().withMessage('Document type is required'),
    body('message').optional().isString()
], requestDocument);

// Get document requests for the current user's application
router.get('/', async (req, res) => {
    try {
        const { getDocumentRequests } = require('../controllers/documentController');
        await getDocumentRequests(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
