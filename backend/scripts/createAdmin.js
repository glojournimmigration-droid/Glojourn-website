// Utility script to ensure an admin user exists.
// Usage: node scripts/createAdmin.js

const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('../config/database');
const User = require('../models/User');

// Load environment variables from the backend root .env if present
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Admin@123';
const ADMIN_NAME = 'Admin';

async function ensureAdmin() {
  try {
    await connectDB();

    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      console.log(`Admin already exists: ${existing.email}`);
      process.exit(0);
    }

    const admin = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin'
    });

    await admin.save();
    console.log(`Admin created: ${admin.email}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err.message);
    process.exit(1);
  }
}

ensureAdmin();
