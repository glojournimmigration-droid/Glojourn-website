const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const env = require('./config/env');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const applicationRoutes = require('./routes/applications');
const documentRoutes = require('./routes/documents');
const documentRequestRoutes = require('./routes/documentRequests');
const adminRoutes = require('./routes/admin');
const assignmentRoutes = require('./routes/assignments');
const sessionRoutes = require('./routes/sessions');

// Initialize Express
const app = express();

// Connect to Database
connectDB();

// If behind a proxy (e.g., load balancer), ensure IPs are read correctly for rate limiting
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(compression()); // Compress responses
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev')); // Logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW * 60 * 1000,
  max: env.RATE_LIMIT_MAX_REQUESTS
});
app.use('/api', limiter);

// Static files for uploaded documents
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/document-requests', documentRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/sessions', sessionRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Glojourn API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong!';

  res.status(statusCode).json({
    message,
    stack: env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Start server
const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
