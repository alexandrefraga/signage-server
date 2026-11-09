import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import getMediaList from './load-media-list.service.js';
import { html } from './view-html.js';

// Configuração para emular o __dirname que não existe no ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definição da porta (ajuste conforme seu arquivo original se necessário)
const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

const MEDIA_DIR = path.join(__dirname, '../media');

// Extensões suportadas
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg'];

// Dicionário de MIME Types
const MIME_TYPES = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

// 1. API: Retorna a lista de itens com o tipo de mídia
app.get('/api/playlist', (req, res) => {
  const playlist = getMediaList();
  res.json({ playlist });
});

// 2. Rota para servir arquivos (com streaming para vídeo e cache para imagem)
app.get('/media/:filename', (req, res) => {
  const filePath = path.join(MEDIA_DIR, req.params.filename);
  console.log(filePath);

  if (!filePath.startsWith(MEDIA_DIR) || !fs.existsSync(filePath)) {
    return res.status(404).send('Arquivo não encontrado');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  // Se for vídeo, suporta Range requests (Seek / Buffering progressivo)
  if (VIDEO_EXTENSIONS.includes(ext)) {
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        return res.status(416).send('Range inválido');
      }

      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });
      return fileStream.pipe(res);
    }
  }

  // Envio padrão para imagens ou requisições sem Range
  res.writeHead(200, {
    'Content-Length': fileSize,
    'Content-Type': contentType,
  });
  fs.createReadStream(filePath).pipe(res);
});

// 3. Rota do Player HTML5
app.get('/player', (req, res) => {
    res.send(html);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`📺 Player unificado: http://localhost:${PORT}/player`);
});
