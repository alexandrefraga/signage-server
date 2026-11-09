import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para emular o __dirname que não existe no ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDIA_DIR = path.join(__dirname, '../media');
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg'];

export default function getMediaList() {
  if (!fs.existsSync(MEDIA_DIR)) return [];
  
  const files = fs.readdirSync(MEDIA_DIR);
  console.log(files)
  return files
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return VIDEO_EXTENSIONS.includes(ext) || IMAGE_EXTENSIONS.includes(ext);
    })
    .sort() // Ordenação alfabética (ex: 01_banner.jpg, 02_video.mp4)
    .map(file => {
      const ext = path.extname(file).toLowerCase();
      const isVideo = VIDEO_EXTENSIONS.includes(ext);
      return {
        name: file,
        type: isVideo ? 'video' : 'image',
        // Duração padrão para imagens em milissegundos (ex: 10 segundos)
        duration: isVideo ? null : 10000 
      };
    });
}