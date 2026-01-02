const { validationResult } = require('express-validator');
const Case = require('../models/Case');
const User = require('../models/User');

// Assign application to coordinator
const assignApplication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { application_id, manager_id } = req.body;
    let manager = null;

    // Verify the application exists
    const application = await Case.findById(application_id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Allow coordinators, managers, and admins to assign managers
    if (!['admin', 'manager', 'coordinator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Verify manager exists and has manager role
    if (manager_id) {
      manager = await User.findById(manager_id);
      if (!manager || manager.role !== 'manager') {
        return res.status(404).json({ message: 'Manager not found' });
      }
    }

    // Ensure coordinator ownership is captured
    if (!application.assignedCoordinator && req.user.role === 'coordinator') {
      application.assignedCoordinator = req.user._id;
    }

    // Update assignment
    application.assignedManager = manager_id || null;

    // Add to timeline for auditing
    if (manager_id) {
      application.timeline.push({
        status: application.status,
        updatedBy: req.user._id,
        notes: `Assigned to manager: ${manager?.name || manager_id}`
      });
    }

    await application.save();

    // Populate the response
    await application.populate('assignedManager', 'name email');
    await application.populate('assignedCoordinator', 'name email');

    res.json({
      message: 'Application assigned successfully',
      application
    });
  } catch (error) {
    console.error('Assign application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get available coordinators
const getAvailableCoordinators = async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const coordinators = await User.find({
      role: 'coordinator',
      isActive: true
    }).select('name email _id');

    res.json({ coordinators });
  } catch (error) {
    console.error('Get coordinators error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get coordinator workload
const getCoordinatorWorkload = async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const coordinators = await User.find({ role: 'coordinator', isActive: true });

    const workloadData = await Promise.all(
      coordinators.map(async (coordinator) => {
        const assignedCases = await Case.countDocuments({
          assignedCoordinator: coordinator._id,
          status: { $in: ['draft', 'submitted', 'under_review'] }
        });

        return {
          coordinator: {
            _id: coordinator._id,
            name: coordinator.name,
            email: coordinator.email
          },
          assignedCases
        };
      })
    );

    res.json({ workload: workloadData });
  } catch (error) {
    console.error('Get coordinator workload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  assignApplication,
  getAvailableCoordinators,
  getCoordinatorWorkload
};
