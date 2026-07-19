'use strict';
// tests/direction.test.js — TASK-003: klavye yön kuyruğu + 180° engeli (FR-2).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createInitialState, start, turn, step } = require('../public/game.js');

test('FR-2: turn() dikey/aynı yön isteğini kabul eder', () => {
  assert.deepEqual(turn({ x: 1, y: 0 }, { x: 0, y: -1 }), { x: 0, y: -1 });
  assert.deepEqual(turn({ x: 1, y: 0 }, { x: 1, y: 0 }), { x: 1, y: 0 });
});

test('FR-2: 180° (tam ters) yön isteği YOK SAYILIR — mevcut yön korunur', () => {
  assert.deepEqual(turn({ x: 1, y: 0 }, { x: -1, y: 0 }), { x: 1, y: 0 });
  assert.deepEqual(turn({ x: 0, y: -1 }, { x: 0, y: 1 }), { x: 0, y: -1 });
});

test('FR-2: step() her adımda kuyruklanmış next yönünü uygular (giriş → yön değişimi ≤1 adım)', () => {
  let s = start(createInitialState());
  s = { ...s, next: turn(s.dir, { x: 0, y: -1 }) }; // yukarı iste (dikey, kabul)
  s = step(s);
  assert.deepEqual(s.dir, { x: 0, y: -1 }, 'step() sonrası dir, uygulanan next ile güncellenmeli');
  assert.deepEqual(s.next, { x: 0, y: -1 }, 'next, uygulanan yönle senkron kalmalı');
});

test('FR-2: sağa giderken sola (180°) istek step() sonrası yön değişikliğine YOL AÇMAZ', () => {
  let s = start(createInitialState()); // dir = {1,0}
  const rejected = turn(s.dir, { x: -1, y: 0 });
  s = { ...s, next: rejected };
  s = step(s);
  assert.deepEqual(s.dir, { x: 1, y: 0 }, 'ters yön reddedildiği için yılan sağa gitmeye devam etmeli');
});
