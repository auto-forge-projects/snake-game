'use strict';
// tests/game.test.js — TASK-002: Canvas oyun döngüsü çekirdek mantığı (fixed-step hareket).
// public/game.js DOM/Canvas'tan bağımsız saf fonksiyonlar export eder (dual-export, roll.js
// kalıbı) — bu dosya yalnız o saf fonksiyonları test eder.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createInitialState, start, step } = require('../public/game.js');

test('FR-1: createInitialState() sabit başlangıç konumu/yönünde, status=idle (hareket etmez)', () => {
  const s = createInitialState();
  assert.equal(s.status, 'idle');
  assert.ok(Array.isArray(s.snake) && s.snake.length >= 2, 'yılan en az 2 hücre uzunluğunda başlamalı');
  assert.deepEqual(s.dir, { x: 1, y: 0 });
  assert.deepEqual(s.next, { x: 1, y: 0 });
  assert.equal(s.score, 0);
  assert.equal(s.stepMs, 100, 'NFR-1: mantık adımı ≤100ms');
});

test('FR-1: status=idle iken step() yılanı HAREKET ETTİRMEZ (kullanıcı eylemi bekler)', () => {
  const s = createInitialState();
  const before = JSON.stringify(s.snake);
  const after = step(s);
  assert.equal(JSON.stringify(after.snake), before, 'idle durumda step() no-op olmalı');
  assert.equal(after.status, 'idle');
});

test('start() status running yapar; sonraki step() yılanı bir hücre ilerletir (büyümeden)', () => {
  let s = start(createInitialState());
  assert.equal(s.status, 'running');
  const prevHead = s.snake[0];
  const prevLen = s.snake.length;
  s = step(s);
  assert.deepEqual(s.snake[0], { x: prevHead.x + 1, y: prevHead.y }, 'baş, dir yönünde bir hücre ilerlemeli');
  assert.equal(s.snake.length, prevLen, 'yem yenmeden yılan uzunluğu değişmemeli (kuyruk düşer)');
});
