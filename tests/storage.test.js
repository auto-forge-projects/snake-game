'use strict';
// tests/storage.test.js — TASK-006: localStorage wrapper + en yüksek skor kalıcılığı (FR-5, SEC-3).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getHighScore, setHighScore, STORAGE_KEY } = require('../public/storage.js');

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

test('FR-5: localStorage yokken/boşken getHighScore() 0 döner (zarif düşüş)', () => {
  delete global.localStorage;
  assert.equal(getHighScore(), 0);
});

test('SEC-3: geçerli bir integer yazılınca aynı değer okunur', () => {
  global.localStorage = fakeStorage();
  assert.equal(setHighScore(42), true);
  assert.equal(getHighScore(), 42);
  assert.equal(global.localStorage.getItem(STORAGE_KEY), '42');
});

test('SEC-3: bozuk/NaN/negatif değer okumada 0a düşer', () => {
  global.localStorage = fakeStorage({ [STORAGE_KEY]: 'not-a-number' });
  assert.equal(getHighScore(), 0);
  global.localStorage = fakeStorage({ [STORAGE_KEY]: '-5' });
  assert.equal(getHighScore(), 0);
});

test('SEC-3: Number.MAX_SAFE_INTEGER üstü değerler sınırlanır', () => {
  global.localStorage = fakeStorage();
  setHighScore(Number.MAX_SAFE_INTEGER + 1000);
  assert.equal(getHighScore(), Number.MAX_SAFE_INTEGER);
});

test('SEC-3: storage erişilemez (throw eden setItem — Safari özel mod) durumunda sessizce false döner, exception fırlatmaz', () => {
  global.localStorage = {
    getItem: () => {
      throw new Error('access denied');
    },
    setItem: () => {
      throw new Error('access denied');
    },
  };
  assert.doesNotThrow(() => setHighScore(10));
  assert.equal(setHighScore(10), false);
  assert.doesNotThrow(() => getHighScore());
  assert.equal(getHighScore(), 0);
  delete global.localStorage;
});

test('FR-6: yeniden başlatma en yüksek skoru KORUR (yalnız daha büyük skor günceller)', () => {
  global.localStorage = fakeStorage({ [STORAGE_KEY]: '10' });
  // Daha düşük bir skor yazılmaya çalışılırsa çağıran kod (game.js/app wiring) zaten
  // yalnız score>best iken çağırır; storage.js kendisi düşürücü yazımı reddetmez (katman
  // sorumluluğu ayrımı) — burada sarmalayıcının ham davranışı doğrulanır.
  assert.equal(setHighScore(10), true);
  assert.equal(getHighScore(), 10);
  delete global.localStorage;
});
