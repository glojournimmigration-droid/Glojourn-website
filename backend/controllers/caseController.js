const { validationResult } = require('express-validator');
const Case = require('../models/Case');
const User = require('../models/User');
const Automation = require('../models/Automation');

const REQUIRED_DOC_TYPES = [
  'passport',
  'visas',
  'work_permits',
  'certificates',
  'prior_applications',
  'tax_financials'
];

const getMissingRequiredDocs = (caseData) => {
  const uploadedTypes = new Set((caseData.documents || []).map((doc) => doc.document_type));
  return REQUIRED_DOC_TYPES.filter((type) => !uploadedTypes.has(type));
};

// @desc    Get all cases with role-based filtering
// @route   GET /api/cases
// @access  Private
const getCases = async (req, res) => {
  try {
    const { status, priority, assignedTo, page = 1, limit = 10 } = req.query;
    const user = req.user;

    // Build query based on user role
    let query = {};

    // Role-based filtering
    switch (user.role) {
      case 'client':
        query.client = user._id;
        break;
      case 'coordinator':
        query.$or = [
          { assignedCoordinator: user._id },
          { assignedCoordinator: { $exists: false } } // Unassigned cases
        ];
        break;
      case 'manager':
        query.$or = [
          { assignedManager: user._id },
          { assignedCoordinator: { $in: await getCoordinatorsUnderManager(user._id) } }
        ];
        break;
      case 'admin':
        // Admin can see all cases
        break;
      default:
        return res.status(403).json({ message: 'Invalid user role' });
    }

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo === 'me') {
      if (user.role === 'coordinator') {
        query.assignedCoordinator = user._id;
      } else if (user.role === 'manager') {
        query.assignedManager = user._id;
      }
    }

    // Pagination
    const skip = (page - 1) * limit;

    const cases = await Case.find(query)
      .populate('client', 'name email')
      .populate('assignedCoordinator', 'name email')
      .populate('assignedManager', 'name email')
      .populate('documents')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Case.countDocuments(query);

    res.json({
      cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single case
// @route   GET /api/cases/:id
// @access  Private
const getCase = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id)
      .populate('client', 'name email profile')
      .populate('assignedCoordinator', 'name email')
      .populate('assignedManager', 'name email')
      .populate('documents')
      .populate('notes.createdBy', 'name role')
      .populate('timeline.updatedBy', 'name role');

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Check permissions
    if (!canAccessCase(req.user, caseData)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ case: caseData });
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new case
// @route   POST /api/cases
// @access  Private
const createCase = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { visaType, applicationDetails, intakeForm, priority = 'medium' } = req.body;
    const clientId = req.user.role === 'client' ? req.user._id : req.body.clientId;

    // Validate client exists
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Only admins can create cases for other clients
    if (req.user.role !== 'admin' && req.user._id.toString() !== clientId.toString()) {
      return res.status(403).json({ message: 'Cannot create case for another user' });
    }

    const fallbackIntake = {
      generalInformation: {
        fullLegalName: client.name || 'Client',
        email: client.email,
        citizenshipCountries: [],
        address: { city: '', state: '', zip: '', country: '' }
      },
      acknowledgment: { agreed: false }
    };

    const caseData = new Case({
      client: clientId,
      visaType,
      applicationDetails,
      intakeForm: intakeForm || fallbackIntake,
      priority,
      status: 'draft'
    });

    await caseData.save();

    // Populate the response
    await caseData.populate('client', 'name email');

    // Trigger automations
    await triggerAutomations('case_created', caseData);

    res.status(201).json({
      message: 'Case created successfully',
      case: caseData
    });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update case
// @route   PUT /api/cases/:id
// @access  Private
const updateCase = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const caseData = await Case.findById(req.params.id);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Check permissions
    if (!canAccessCase(req.user, caseData)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = req.body;
    const oldStatus = caseData.status;

    const clientFields = ['applicationDetails', 'intakeForm', 'priority'];
    const staffFields = [...clientFields, 'status', 'assignedCoordinator', 'assignedManager', 'visaType'];
    const allowedFields = ['admin', 'manager', 'coordinator'].includes(req.user.role) ? staffFields : clientFields;

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        caseData[key] = updates[key];
      }
    });

    if (updates.status && ['submitted', 'under_review', 'processing', 'approved', 'completed'].includes(updates.status)) {
      await caseData.populate('documents');
      const missingDocs = getMissingRequiredDocs(caseData);
      if (missingDocs.length) {
        return res.status(400).json({
          message: 'Upload all required documents before advancing the case status.',
          missingDocuments: missingDocs
        });
      }
    }

    // Set updated by for timeline
    caseData._updatedBy = req.user._id;

    await caseData.save();

    // Trigger automations if status changed
    if (updates.status && updates.status !== oldStatus) {
      await triggerAutomations('status_change', caseData, { oldStatus, newStatus: updates.status });
    }

    await caseData.populate(['client', 'assignedCoordinator', 'assignedManager', 'documents']);

    res.json({
      message: 'Case updated successfully',
      case: caseData
    });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete case
// @route   DELETE /api/cases/:id
// @access  Private
const deleteCase = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Only admins can delete cases
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete cases' });
    }

    await Case.findByIdAndDelete(req.params.id);

    res.json({ message: 'Case deleted successfully' });
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add note to case
// @route   POST /api/cases/:id/notes
// @access  Private
const addNote = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    const caseData = await Case.findById(req.params.id);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Check permissions
    if (!canAccessCase(req.user, caseData)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    caseData.notes.push({
      content: content.trim(),
      createdBy: req.user._id
    });

    await caseData.save();

    res.json({
      message: 'Note added successfully',
      note: caseData.notes[caseData.notes.length - 1]
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to check case access permissions
const canAccessCase = (user, caseData) => {
  switch (user.role) {
    case 'client':
      return caseData.client.toString() === user._id.toString();
    case 'coordinator':
      return caseData.assignedCoordinator?.toString() === user._id.toString();
    case 'manager':
      return caseData.assignedManager?.toString() === user._id.toString() ||
             caseData.assignedCoordinator?.toString() === user._id.toString();
    case 'admin':
      return true;
    default:
      return false;
  }
};

// Helper function to get coordinators under a manager
const getCoordinatorsUnderManager = async (managerId) => {
  // This would need a proper organizational structure
  // For now, return empty array
  return [];
};

// Helper function to trigger automations
const triggerAutomations = async (triggerType, caseData, triggerData = {}) => {
  try {
    const automations = await Automation.find({ isActive: true });

    for (const automation of automations) {
      // Check if trigger conditions match
      if (automation.trigger.type === triggerType) {
        let shouldExecute = true;

        // Check trigger conditions
        if (triggerType === 'status_change' && automation.trigger.conditions.status) {
          shouldExecute = triggerData.newStatus === automation.trigger.conditions.status;
        }

        if (shouldExecute) {
          await automation.execute(caseData, triggerData);
        }
      }
    }
  } catch (error) {
    console.error('Automation trigger error:', error);
  }
};

module.exports = {
  getCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
  addNote
};
