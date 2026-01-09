// Utility script to ensure an admin user exists.
// Usage:
//   From backend directory with .env set:  node scripts/createAdmin.js
//   Or pass overrides: ADMIN_EMAIL=me@example.com ADMIN_PASSWORD=Secret123 node scripts/createAdmin.js

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the backend root .env if present
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/database');
const User = require('../models/User');

// Fail fast with helpful error when critical env is missing
const requireEnv = (name) => {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Missing required environment variable: ${name}. Create backend/.env or pass it inline (e.g., ${name}=value).`);
  }
  return val;
};

// Mongo connection depends on env.js, but we validate the two critical ones here
requireEnv('JWT_SECRET');
requireEnv('MONGODB_URI');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

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
