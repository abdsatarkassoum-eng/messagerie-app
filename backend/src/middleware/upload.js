const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const baseUploadDir = path.resolve(__dirname, '../../uploads');

function folderFor(fieldOrMime) {
  if (fieldOrMime.startsWith('image/')) return 'images';
  if (fieldOrMime.startsWith('video/')) return 'videos';
  if (fieldOrMime.startsWith('audio/')) return 'audio';
  return 'files';
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = req.baseUrl.includes('users') && file.fieldname === 'avatar'
      ? 'avatars'
      : folderFor(file.mimetype);
    const dir = path.join(baseUploadDir, sub);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 Mo max
});

module.exports = upload;
