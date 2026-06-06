const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image buffer to Cloudinary.
 * Used for: avatars (skillhub/avatars), company logos (skillhub/logos)
 * @param {Buffer} buffer   - File buffer from multer memoryStorage
 * @param {string} folder   - Cloudinary folder
 * @param {string} publicId - Stable public_id; re-uploads overwrite the old image
 * @returns {Promise<string>} Secure URL
 */
function uploadImage(buffer, folder, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id:      publicId,
        overwrite:      true,
        resource_type:  'image',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face',
                           quality: 'auto', fetch_format: 'auto' }],
      },
      (err, result) => {
        if (err || !result) return reject(err || new Error('Cloudinary upload failed'));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Upload a raw file buffer to Cloudinary.
 * Used for: resumes (PDF, DOC, DOCX) in skillhub/resumes
 * @param {Buffer} buffer   - File buffer from multer memoryStorage
 * @param {string} folder   - Cloudinary folder
 * @param {string} publicId - Stable public_id; re-uploads overwrite the old file
 * @returns {Promise<string>} Secure URL
 */
function uploadRaw(buffer, folder, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, overwrite: true, resource_type: 'raw' },
      (err, result) => {
        if (err || !result) return reject(err || new Error('Cloudinary upload failed'));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary by its full public_id.
 * Safe to call even if the file doesn't exist.
 * @param {string} publicId       - e.g. 'skillhub/avatars/user-abc123'
 * @param {'image'|'raw'} [type]  - resource_type (default: 'image')
 */
async function deleteFile(publicId, type = 'image') {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: type });
  } catch {
    // Non-fatal — cleanup failure shouldn't block the response
  }
}

// Keep backward-compatible alias
const deleteImage = (publicId) => deleteFile(publicId, 'image');

module.exports = { cloudinary, uploadImage, uploadRaw, deleteFile, deleteImage };