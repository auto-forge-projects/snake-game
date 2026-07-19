'use strict';
// tests/security-headers.test.js — TASK-008: SEC-1 (başlıklar), SEC-2 (kilitli statik servis),
// SEC-7 (hata/yanıt hijyeni).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');
const app = require('../src/server.js');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

test('SEC-1: güvenlik başlıkları set edilir (CSP, nosniff, frame-options, referrer-policy)', async () => {
  const res = await request(app).get('/');
  assert.match(res.headers['content-security-policy'], /default-src 'self'/);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-frame-options'], 'DENY');
  assert.equal(res.headers['referrer-policy'], 'no-referrer');
  assert.equal(res.headers['x-powered-by'], undefined, 'x-powered-by kapalı olmalı');
});

test('SEC-2: dotfile servis edilmez → 404 (gerçek dosya var olsa bile)', async () => {
  const fixture = path.join(PUBLIC_DIR, '.dotfile-fixture');
  fs.writeFileSync(fixture, 'should-not-be-served');
  try {
    const res = await request(app).get('/.dotfile-fixture');
    assert.equal(res.status, 404);
  } finally {
    fs.unlinkSync(fixture);
  }
});

test('SEC-7: bilinmeyen route için sade 404, stack trace/iç yol sızmaz', async () => {
  const res = await request(app).get('/nope-route-xyz');
  assert.equal(res.status, 404);
  assert.ok(!/at\s+\S+\s+\(/.test(res.text || ''), 'gövdede stack-trace izi olmamalı');
});

test('SEC-7: 500 hata yanıtı sabit mesaj döner, hata detayı sızdırmaz', () => {
  const stack = app._router.stack;
  const errorHandler = stack.map((l) => l.handle).find((h) => typeof h === 'function' && h.length === 4);
  assert.ok(errorHandler, 'server.js içinde 4-arity Express hata-yakalama middleware bulunamadı');

  let statusCode;
  let body;
  const fakeRes = {
    status(code) { statusCode = code; return this; },
    send(payload) { body = payload; return this; },
  };
  const fakeErr = new Error('deliberate test error — should never leak to client');
  errorHandler(fakeErr, {}, fakeRes, () => {});

  assert.equal(statusCode, 500);
  assert.equal(body, 'Internal Server Error');
  assert.ok(!String(body).includes(fakeErr.message));
});
