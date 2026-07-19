'use strict';
// tests/collision.test.js — TASK-005: duvar/kendine çarpışma tespiti + oyun sonu (FR-4).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createInitialState, start, isOutOfBounds, isSelfCollision, step } = require('../public/game.js');

test('FR-4: isOutOfBounds() ızgara sınırı dışındaki hücreleri true döndürür', () => {
  const grid = { cols: 20, rows: 20 };
  assert.equal(isOutOfBounds({ x: -1, y: 5 }, grid), true);
  assert.equal(isOutOfBounds({ x: 20, y: 5 }, grid), true);
  assert.equal(isOutOfBounds({ x: 5, y: 20 }, grid), true);
  assert.equal(isOutOfBounds({ x: 0, y: 0 }, grid), false);
  assert.equal(isOutOfBounds({ x: 19, y: 19 }, grid), false);
});

test('FR-4: isSelfCollision() baş, gövdeyle aynı hücredeyse true döner', () => {
  assert.equal(isSelfCollision({ x: 5, y: 5 }, [{ x: 5, y: 5 }, { x: 4, y: 5 }]), true);
  assert.equal(isSelfCollision({ x: 5, y: 5 }, [{ x: 4, y: 5 }, { x: 3, y: 5 }]), false);
});

test('FR-4: baş ızgara dışına çıkınca step() döngüyü durdurur (status=gameover), final skor korunur', () => {
  let s = start(createInitialState());
  s = { ...s, snake: [{ x: 19, y: 10 }, { x: 18, y: 10 }, { x: 17, y: 10 }], score: 3, food: { x: 0, y: 0 } };
  s = step(s); // sağa (19,10) -> (20,10) sınır dışı
  assert.equal(s.status, 'gameover');
  assert.equal(s.score, 3, 'final skor korunmalı');
});

test('FR-4: baş kendi gövdesine çarpınca step() döngüyü durdurur (status=gameover)', () => {
  let s = start(createInitialState());
  // Baş (5,5); sola gidiyor → next adımda (4,5)'e girecek, bu hücre zaten gövdede mevcut.
  s = {
    ...s,
    dir: { x: -1, y: 0 },
    next: { x: -1, y: 0 },
    snake: [
      { x: 5, y: 5 }, // baş
      { x: 4, y: 5 }, // baş bir sonraki adımda buraya girecek
      { x: 4, y: 6 },
      { x: 5, y: 6 },
    ],
    food: { x: 0, y: 0 },
  };
  s = step(s);
  assert.equal(s.status, 'gameover', 'baş kendi gövdesine girince oyun bitmeli');
});

test('FR-4: gameover sonrası step() tekrar çağrılırsa yılan artık hareket ETMEZ', () => {
  let s = start(createInitialState());
  s = { ...s, snake: [{ x: 19, y: 10 }, { x: 18, y: 10 }], food: { x: 0, y: 0 } };
  s = step(s);
  assert.equal(s.status, 'gameover');
  const snakeAfterGameOver = JSON.stringify(s.snake);
  s = step(s);
  assert.equal(JSON.stringify(s.snake), snakeAfterGameOver, 'gameover durumunda step() no-op olmalı');
});
