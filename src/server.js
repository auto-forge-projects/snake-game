'use strict';
// snake-game — Express statik sunucu + /health. TÜM oyun mantığı/durumu istemcide
// (public/game.js, public/storage.js); bu dosya kalıcı veri tutmaz, yalnız statik
// dosya servisi + sağlık kontrolü yapar (NFR-3, NFR-8, TASK-001/008).
const path = require('node:path');
const express = require('express');

const app = express();
app.disable('x-powered-by'); // SEC-1

// SEC-1: güvenlik başlıkları (Helmet kullanmadan elle — bkz. decisions/DL-09-001.md).
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// SEC-2: yalnız public/ kökü servis edilir; dotfile'lar (.git, .env vb.) asla servis edilmez,
// dizin listeleme kapalı (express.static varsayılanı zaten dizin listelemez). Tek ek route
// GET /health.
app.use(
  express.static(path.join(__dirname, '..', 'public'), {
    dotfiles: 'ignore',
    index: 'index.html',
    redirect: false,
  })
);

// NFR-8: sabit, tek alanlı yanıt — versiyon/env/uptime sızdırmaz.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// SEC-7: bilinmeyen route için sade 404, dizin listeleme/stack trace yok.
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// SEC-7: prod'da hata detayı/stack trace sızmaz.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(500).send('Internal Server Error');
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`snake-game on :${port}`));
}

module.exports = app;
