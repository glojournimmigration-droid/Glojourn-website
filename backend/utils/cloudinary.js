const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const env = require('../config/env');

const baseFolder = env.CLOUDINARY_FOLDER || 'glojourn/documents';

const uploadBufferToCloudinary = (buffer, { folder, publicId } = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder || baseFolder,
        resource_type: 'auto',
        access_mode: 'authenticated',
        public_id: publicId,
        invalidate: true
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'auto',
      invalidate: true
    });
  } catch (error) {
    console.warn('Cloudinary delete failed:', error.message);
  }
};

const getSignedUrl = (publicId, ttlSeconds = env.CLOUDINARY_SIGNED_URL_TTL) => {
  if (!publicId) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    type: 'authenticated',
    resource_type: 'auto',
    expires_at: expiresAt
  });
};

const buildCaseFolder = (applicationId) => `${baseFolder}/cases/${applicationId}`;

module.exports = {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  getSignedUrl,
  buildCaseFolder
};
