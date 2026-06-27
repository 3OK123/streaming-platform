// Create upload directories
const fs = require('fs');
const path = require('path');

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const dirs = [
  uploadDir,
  path.join(uploadDir, 'episodes'),
  path.join(uploadDir, 'images'),
  path.join(uploadDir, 'thumbnails')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('✅ Upload directories created');
