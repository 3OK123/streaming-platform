const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { ALLOWED_VIDEO_TYPES, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } = require('../config/constants');

const createStorage = (uploadPath) => {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;
      cb(null, filename);
    }
  });
};

const uploadVideo = multer({
  storage: createStorage(path.join(process.env.UPLOAD_DIR || './uploads', 'episodes')),
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only MP4 files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_FILE_SIZE }
}).single('video');

const uploadImage = multer({
  storage: createStorage(path.join(process.env.UPLOAD_DIR || './uploads', 'images')),
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only JPEG and PNG images are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 }
}).single('image');

module.exports = {
  uploadVideo,
  uploadImage
};
