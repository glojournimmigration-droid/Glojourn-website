// Only admins, managers, and coordinators can create accounts
    // Managers and coordinators can only create client accounts
    if (['admin', 'coordinator', 'manager'].includes(role)) {
      if (req.user?.role === 'coordinator' && role !== 'client') {
        return res.status(403).json({ message: 'Coordinators can only create client accounts' });
      }
      if (req.user?.role === 'manager' && !['client', 'coordinator'].includes(role)) {
        return res.status(403).json({ message: 'Managers can only create client and coordinator accounts' });
      }
      if (!req.user || !['admin', 'manager', 'coordinator'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions to create this role' });
      }
    }
=======
    // Only admins, managers, and coordinators can create accounts
    // Managers and coordinators can only create client accounts
    if (['admin', 'coordinator', 'manager'].includes(role)) {
      if (req.user?.role === 'coordinator' && role !== 'client') {
        return res.status(403).json({ message: 'Coordinators can only create client accounts' });
      }
      if (req.user?.role === 'manager' && !['client', 'coordinator'].includes(role)) {
        return res.status(403).json({ message: 'Managers can only create client and coordinator accounts' });
      }
      if (!req.user || !['admin', 'manager', 'coordinator'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions to create this role' });
      }
    }
