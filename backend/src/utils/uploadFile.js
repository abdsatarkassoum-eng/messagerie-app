const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'media';

function folderFor(mimetype) {
  if (mimetype.startsWith('image/')) return 'images';
  if (mimetype.startsWith('video/')) return 'videos';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'files';
}

// Envoie un fichier (reçu via multer memoryStorage) vers Supabase Storage
// et renvoie son URL publique permanente.
async function uploadFile(file, folderOverride) {
  const folder = folderOverride || folderFor(file.mimetype);
  const extMatch = file.originalname.match(/\.[^.]+$/);
  const ext = extMatch ? extMatch[0] : '';
  const path = `${folder}/${uuidv4()}${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    throw new Error(`Échec de l'envoi vers le stockage : ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

module.exports = uploadFile;
