'use strict';
// snake-game — Express statik sunucu + /health. TÜM oyun mantığı/durumu istemcide
// (public/game.js, public/storage.js); bu dosya kalıcı veri tutmaz, yalnız statik
// dosya servisi + sağlık kontrolü yapar (NFR-3, NFR-8, TASK-001).
// Güvenlik sertleştirmesi (başlıklar/dotfile/hata hijyeni — SEC-1/2/7) TASK-008'de eklenir.
const path = require('node:path');
const express = require('express');

const app = express();

app.use(express.static(path.join(__dirname, '..', 'public')));

// NFR-8: sabit, tek alanlı yanıt.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`snake-game on :${port}`));
}

module.exports = app;
