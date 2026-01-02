const { validationResult } = require('express-validator');
const Case = require('../models/Case');
const User = require('../models/User');

const REQUIRED_DOC_TYPES = [
  'passport',
  'visas',
  'work_permits',
  'certificates',
  'prior_applications',
  'tax_financials'
];

const getMissingRequiredDocs = (application) => {
  const uploadedTypes = new Set((application.documents || []).map((doc) => doc.document_type));
  return REQUIRED_DOC_TYPES.filter((type) => !uploadedTypes.has(type));
};

// Shape a Case document into the frontend contract
const formatApplication = (caseDoc) => {
  const documents = Array.isArray(caseDoc.documents)
    ? caseDoc.documents.map((doc) => ({
      id: doc._id?.toString?.() || String(doc),
      file_name: doc.file_name,
      document_type: doc.document_type,
      status: doc.status,
      uploaded_at: doc.createdAt,
    }))
    : [];

  const intake = caseDoc.intakeForm || {};
  const general = intake.generalInformation || {};
  const immigration = intake.immigrationHistory || {};
  const passport = intake.passportInformation || {};
  const educationEmployment = intake.educationEmployment || {};
  const address = general.address || {};

  return {
    id: caseDoc._id.toString(),
    case_number: caseDoc.caseNumber,
    client_id: caseDoc.client?._id?.toString() || null,
    client_name: caseDoc.client?.name,
    client_email: caseDoc.client?.email,
    assigned_coordinator: caseDoc.assignedCoordinator ? {
      id: caseDoc.assignedCoordinator._id?.toString(),
      name: caseDoc.assignedCoordinator.name,
      email: caseDoc.assignedCoordinator.email
    } : null,
    assigned_manager: caseDoc.assignedManager ? {
      id: caseDoc.assignedManager._id?.toString(),
      name: caseDoc.assignedManager.name,
      email: caseDoc.assignedManager.email
    } : null,
    status: caseDoc.status,
    priority: caseDoc.priority,
    personal_details: {
      visa_type: caseDoc.visaType,
      destination_country: caseDoc.applicationDetails?.destinationCountry,
      purpose_of_visit: caseDoc.applicationDetails?.purposeOfVisit,
      intended_date_of_entry: caseDoc.applicationDetails?.intendedDateOfEntry,
      intended_length_of_stay: caseDoc.applicationDetails?.intendedLengthOfStay,
      accommodation_details: caseDoc.applicationDetails?.accommodationDetails,
      financial_info: caseDoc.applicationDetails?.financialInfo,
      full_name: general.fullLegalName,
      other_names: general.otherNames,
      date_of_birth: general.dateOfBirth,
      birth_place: general.birthCityCountry,
      citizenship: general.citizenshipCountries,
      gender: general.gender,
      marital_status: general.maritalStatus,
      address: [address.city, address.state, address.zip, address.country]
        .filter(Boolean)
        .join(', '),
      phone_mobile: general.phoneMobile,
      phone_other: general.phoneOther,
      preferred_contact_method: general.preferredContactMethod,
      immigration_status: immigration.currentStatus,
      last_entry_date: immigration.lastEntryDate,
      last_entry_place: immigration.lastEntryPlace,
      manner_of_last_entry: immigration.mannerOfLastEntry,
      class_of_admission: immigration.classOfAdmission,
      i94_number: immigration.i94Number,
      passport_country: passport.passportCountry,
      passport_number: passport.passportNumber,
      passport_issue_date: passport.issuedDate,
      passport_expiration_date: passport.expirationDate,
      passport_place_of_issue: passport.placeOfIssue,
      alien_number: passport.alienNumber,
      ssn: passport.ssn,
      highest_education: educationEmployment.highestEducation,
    },
    intake_form: intake || null,
    documents,
    created_at: caseDoc.createdAt,
    updated_at: caseDoc.updatedAt,
  };
};

// Get all applications with role-based filtering
const getApplications = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, priority, page = 1, limit = 10 } = req.query;
    const user = req.user;

    const query = {};

    switch (user.role) {
      case 'client':
        query.client = user._id;
        break;
      case 'coordinator':
        query.$or = [
          { assignedCoordinator: user._id },
          { assignedCoordinator: { $exists: false } },
        ];
        break;
      case 'manager':
        query.$or = [
          { assignedManager: user._id },
          { assignedCoordinator: { $in: await getCoordinatorsUnderManager(user._id) } },
        ];
        break;
      case 'admin':
        break;
      default:
        return res.status(403).json({ message: 'Invalid user role' });
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const numericLimit = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (parseInt(page, 10) - 1) * numericLimit;

    const applications = await Case.find(query)
      .populate('client', 'name email')
      .populate('assignedCoordinator', 'name email')
      .populate('assignedManager', 'name email')
      .populate('documents')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit);

    const total = await Case.countDocuments(query);

    res.json({
      applications: applications.map(formatApplication),
      pagination: {
        page: parseInt(page, 10),
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit),
      },
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's own application
const getMyApplication = async (req, res) => {
  try {
    const application = await Case.findOne({ client: req.user._id })
      .populate('assignedCoordinator', 'name email')
      .populate('assignedManager', 'name email')
      .populate('documents');

    if (!application) {
      return res.json({ application: null });
    }

    res.json({ application: formatApplication(application) });
  } catch (error) {
    console.error('Get my application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new application
const createApplication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { visaType, applicationDetails, intakeForm, priority = 'medium' } = req.body;

    // Check if user already has an application
    const existingApplication = await Case.findOne({ client: req.user._id });
    if (existingApplication) {
      return res.status(400).json({ message: 'You already have an application' });
    }

    const application = new Case({
      client: req.user._id,
      visaType,
      applicationDetails,
      intakeForm,
      priority,
      status: 'draft'
    });

    await application.save();

    // Populate the response
    await application.populate('client', 'name email');

    res.status(201).json({
      message: 'Application created successfully',
      application: formatApplication(application)
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update application
const updateApplication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const application = await Case.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check permissions
    if (application.client.toString() !== req.user._id.toString() &&
      !['admin', 'coordinator', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = req.body;

    const clientFields = ['visaType', 'applicationDetails', 'intakeForm', 'priority'];
    const staffFields = [...clientFields, 'status', 'assignedCoordinator', 'assignedManager'];
    const isStaff = ['admin', 'coordinator', 'manager'].includes(req.user.role);
    const requestedStatus = updates.status;

    const allowedFields = isStaff ? staffFields : [...clientFields];
    if (!isStaff && requestedStatus === 'submitted') {
      allowedFields.push('status');
    }

    Object.entries(req.body).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        application[key] = value;
      }
    });

    if (!isStaff && requestedStatus && requestedStatus !== 'submitted') {
      return res.status(403).json({ message: 'Only staff can change the application status further.' });
    }

    if (requestedStatus && ['submitted', 'under_review', 'processing', 'approved', 'completed'].includes(requestedStatus)) {
      await application.populate('documents');
      const missingDocs = getMissingRequiredDocs(application);
      if (missingDocs.length) {
        return res.status(400).json({
          message: 'Upload all required documents before submitting.',
          missingDocuments: missingDocs
        });
      }
    }

    // Track who performed the update for timeline entries
    application._updatedBy = req.user._id;

    await application.save();

    res.json({
      message: 'Application updated successfully',
      application: formatApplication(await application.populate(['client', 'assignedCoordinator', 'assignedManager', 'documents']))
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to get coordinators under a manager
const getCoordinatorsUnderManager = async (managerId) => {
  // This would need a proper organizational structure
  // For now, return empty array
  return [];
};

module.exports = {
  getApplications,
  getMyApplication,
  createApplication,
  updateApplication
};
