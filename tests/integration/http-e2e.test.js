'use strict';
// tests/integration/http-e2e.test.js — Faz 11: gerçek HTTP sunucusu üzerinden uçtan uca
// entegrasyon. Birim testleri (tests/*.test.js) modülleri izole test eder; burada
// index.html'in gerçekten servis ettiği DOM id'leri ile game.js'in beklediği id'lerin
// (bootstrap.test.js'teki sahte DOM) EŞLEŞTİĞİ doğrulanır — HTML/JS arasında sürüklenirse
// (ör. biri "start-btn" diğeri "startBtn" kullanırsa) birim testleri bunu YAKALAMAZ,
// yalnız gerçek sunucudan çekilen index.html üzerinden çalışan bu test yakalar.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../src/server.js');

const REQUIRED_IDS = ['board', 'score', 'best', 'status', 'start-btn', 'restart-btn'];

test('FR-1: GET / servis edilen index.html oyunun tüm HUD/kontrol id\'lerini içerir', async () => {
  const res = await request(app).get('/');
  assert.equal(res.status, 200);
  for (const id of REQUIRED_IDS) {
    assert.match(res.text, new RegExp(`id="${id}"`), `#${id} index.html'de bulunamadı`);
  }
});

test('FR-1: index.html game.js ve storage.js\'i script olarak yükler (bootstrap kablolaması)', async () => {
  const res = await request(app).get('/');
  assert.match(res.text, /<script src="\/storage\.js">/);
  assert.match(res.text, /<script src="\/game\.js">/);
});

test('NFR-6: statik varlıklar (styles.css, game.js, storage.js) 200 ile ve doğru content-type ile servis edilir', async () => {
  const assets = [
    { path: '/styles.css', type: /css/ },
    { path: '/game.js', type: /javascript/ },
    { path: '/storage.js', type: /javascript/ },
  ];
  for (const a of assets) {
    const res = await request(app).get(a.path);
    assert.equal(res.status, 200, `${a.path} 200 dönmedi`);
    assert.match(res.headers['content-type'], a.type, `${a.path} content-type uyuşmadı`);
  }
});

test('FR-4/NFR-5: index.html oyun-sonu ve skor bölgeleri doğru aria-live önceliğiyle işaretli', async () => {
  const res = await request(app).get('/');
  assert.match(res.text, /id="score"[^>]*aria-live="polite"/);
  assert.match(res.text, /id="best"[^>]*aria-live="polite"/);
  assert.match(res.text, /id="status"[^>]*aria-live="assertive"/);
});

test('NFR-3/SEC-2: bilinmeyen route + dotfile hiçbir zaman 200 dönmez (saldırı yüzeyi asgari)', async () => {
  const unknown = await request(app).get('/does-not-exist');
  assert.equal(unknown.status, 404);
  const dotfile = await request(app).get('/.env');
  assert.notEqual(dotfile.status, 200);
});
