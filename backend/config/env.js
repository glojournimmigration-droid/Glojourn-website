const dotenv = require('dotenv');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const requireEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

const jwtSecret = requireEnv('JWT_SECRET');
const mongoUri = process.env.MONGODB_URI || (isProduction ? null : 'mongodb://localhost:27017/glojourn');
if (!mongoUri) {
    throw new Error('Missing required environment variable: MONGODB_URI');
}

const cloudinaryCloudName = requireEnv('CLOUDINARY_CLOUD_NAME');
const cloudinaryApiKey = requireEnv('CLOUDINARY_API_KEY');
const cloudinaryApiSecret = requireEnv('CLOUDINARY_API_SECRET');

module.exports = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT) || 5000,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    MONGODB_URI: mongoUri,
    RATE_LIMIT_WINDOW: Number(process.env.RATE_LIMIT_WINDOW) || 15,
    RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    MAX_FILE_SIZE_BYTES: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf')
        .split(',')
        .map((type) => type.trim())
        .filter(Boolean),
    CLOUDINARY_CLOUD_NAME: cloudinaryCloudName,
    CLOUDINARY_API_KEY: cloudinaryApiKey,
    CLOUDINARY_API_SECRET: cloudinaryApiSecret,
    CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || 'glojourn/documents',
    CLOUDINARY_SIGNED_URL_TTL: Number(process.env.CLOUDINARY_SIGNED_URL_TTL) || 900
};
