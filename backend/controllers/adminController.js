const User = require('../models/User');
const Case = require('../models/Case');
const Session = require('../models/Session');

// Get admin statistics
const getStats = async (req, res) => {
  try {
    if (!['admin', 'coordinator', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [totalUsers, activeUsers, usersByRoleAgg] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }])
    ]);

    const roleCounts = usersByRoleAgg.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const [totalCases, casesByStatus] = await Promise.all([
      Case.countDocuments(),
      Case.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    const statusCounts = casesByStatus.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const recentCases = await Case.find()
      .populate('client', 'name email')
      .populate('assignedCoordinator', 'name email')
      .populate('assignedManager', 'name email')
      .populate('documents')
      .sort({ createdAt: -1 })
      .limit(10);

    const [totalSessions] = await Promise.all([
      Session.countDocuments()
    ]);

    const formatRecent = (caseDoc) => ({
      id: caseDoc._id.toString(),
      client_name: caseDoc.client?.name,
      client_email: caseDoc.client?.email,
      assigned_coordinator: caseDoc.assignedCoordinator ? {
        name: caseDoc.assignedCoordinator.name,
        email: caseDoc.assignedCoordinator.email
      } : null,
      assigned_manager: caseDoc.assignedManager ? {
        name: caseDoc.assignedManager.name,
        email: caseDoc.assignedManager.email
      } : null,
      personal_details: {
        visa_type: caseDoc.visaType,
        destination_country: caseDoc.applicationDetails?.destinationCountry
      },
      status: caseDoc.status,
      documents: Array.isArray(caseDoc.documents) ? caseDoc.documents.map((doc) => ({
        id: doc._id?.toString?.() || String(doc),
        file_name: doc.file_name,
        document_type: doc.document_type,
        status: doc.status,
        uploaded_at: doc.createdAt,
      })) : [],
      created_at: caseDoc.createdAt,
      updated_at: caseDoc.updatedAt
    });

    res.json({
      applications: {
        total: totalCases,
        submitted: statusCounts.submitted || 0,
        under_review: statusCounts.under_review || 0,
        processing: statusCounts.processing || 0,
        approved: statusCounts.approved || 0,
        rejected: statusCounts.rejected || 0,
        completed: statusCounts.completed || 0
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        clients: roleCounts.client || 0,
        coordinators: roleCounts.coordinator || 0,
        managers: roleCounts.manager || 0,
        admins: roleCounts.admin || 0
      },
      sessions: totalSessions,
      recent_applications: recentCases.map(formatRecent)
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStats
};
