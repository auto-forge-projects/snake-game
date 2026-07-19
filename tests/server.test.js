'use strict';
// tests/server.test.js — TASK-001: statik servis + health check (NFR-8).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server.js');

test('GET /health → 200 {"status":"ok"} (NFR-8)', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: 'ok' });
});

test('GET / → 200 statik index.html servis edilir (public/)', async () => {
  const res = await request(app).get('/');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /html/);
});
