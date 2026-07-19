'use strict';
// tests/food.test.js — TASK-004: yem üretimi (gövde dışı), yeme/büyüme/skor (FR-3).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createInitialState, start, spawnFood, step } = require('../public/game.js');

function cellIn(list, cell) {
  return list.some((c) => c.x === cell.x && c.y === cell.y);
}

test('FR-3: spawnFood() yılan gövdesi İÇİNDE bir hücre asla döndürmez (retry ile)', () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ];
  const grid = { cols: 2, rows: 1, cell: 20 }; // yalnız (0,0) ve (1,0) var — ikisi de yılan
  // rng sırayla: (0,0) aday, (1,0) aday, sonra grid genişletilmiş fallback aranmaz;
  // gerçekçi test için 3 hücreli grid kullan: (0,0) ve (1,0) dolu, (0,... ) serbest yok.
  // Bu yüzden 1x3 grid: (0,0) dolu, (1,0) dolu, (2,0) serbest.
  const grid3 = { cols: 3, rows: 1, cell: 20 };
  let call = 0;
  const rng = () => {
    // İlk çağrılar (0,0) ve (1,0)'ı, üçüncüsü (2,0)'ı üretecek şekilde sırayla 0, 1/3, 2/3 döndür.
    const seq = [0, 0, 1 / 3, 0, 2 / 3, 0];
    return seq[call++ % seq.length];
  };
  const food = spawnFood(snake, grid3, rng);
  assert.ok(!cellIn(snake, food), 'üretilen yem gövde hücrelerinden biri OLMAMALI');
  assert.deepEqual(food, { x: 2, y: 0 });
});

test('FR-3: yılan başı yem hücresine girince bir birim uzar, skor 1 artar, yeni yem gövde dışında', () => {
  let s = start(createInitialState());
  s = { ...s, food: { x: s.snake[0].x + 1, y: s.snake[0].y } }; // tam bir adım ilerisi
  const prevLen = s.snake.length;
  s = step(s);
  assert.equal(s.score, 1, 'yem yenince skor 1 artmalı');
  assert.equal(s.snake.length, prevLen + 1, 'yem yenince yılan bir birim uzamalı (kuyruk düşmez)');
  assert.ok(!cellIn(s.snake, s.food), 'yeni yem yılan gövdesi DIŞINDA bir hücrede olmalı');
});

test('FR-3: yem yenmeyen normal adımda skor/uzunluk değişmez', () => {
  let s = start(createInitialState());
  s = { ...s, food: { x: 999, y: 999 } }; // ulaşılamaz — yenmeyecek
  const prevLen = s.snake.length;
  s = step(s);
  assert.equal(s.score, 0);
  assert.equal(s.snake.length, prevLen);
});
