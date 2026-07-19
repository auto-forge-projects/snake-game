'use strict';
// tests/restart.test.js — TASK-007: yeniden başlatma akışı (FR-6).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createInitialState, start, step, resetState } = require('../public/game.js');

test('FR-6: resetState(best) yılanı başlangıç durumuna sıfırlar, skor 0, oyun hemen başlar', () => {
  const s = resetState(50);
  assert.equal(s.status, 'running', '"Tekrar Oyna" sonrası oyun yeniden başlamalı (bekletmeden)');
  assert.equal(s.score, 0);
  assert.equal(s.best, 50, 'en yüksek skor KORUNMALI');
  assert.deepEqual(s.dir, { x: 1, y: 0 });
  assert.equal(s.snake.length, 3, 'yılan başlangıç uzunluğuna dönmeli');
});

test('FR-6: bir oyun oynanıp bitse bile resetState sonrası önceki oyunun kalıntısı YOK', () => {
  let s = start(createInitialState(0));
  s = { ...s, food: { x: s.snake[0].x + 1, y: s.snake[0].y } };
  s = step(s); // yem ye → uzasın, skor artsın
  assert.equal(s.score, 1);
  s = { ...s, snake: [{ x: 19, y: 10 }, { x: 18, y: 10 }] };
  s = step(s); // duvara çarp → gameover
  assert.equal(s.status, 'gameover');

  const finalBest = Math.max(s.best, s.score);
  const restarted = resetState(finalBest);
  assert.equal(restarted.status, 'running');
  assert.equal(restarted.score, 0);
  assert.equal(restarted.snake.length, 3);
  assert.equal(restarted.best, finalBest, 'en yüksek skor yeni oyuna taşınmalı');
});
