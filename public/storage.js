'use strict';
// public/storage.js — FR-5/SEC-3: `localStorage` üzerine ince, sertleştirilmiş bir sarmalayıcı.
// Tek anahtar (`snake.highScore`) yazar/okur. Okuma HER ZAMAN try/catch + parseInt + NaN/negatif
// koruması ile yapılır; erişilemeyen depolamada (Safari özel mod, quota, vb.) zarif biçimde 0'a
// düşer, exception fırlatmaz. Çift-ortam export (roll.js kalıbı — bkz. decisions/DL-09-001.md).

const STORAGE_KEY = 'snake.highScore';
const MAX_SAFE = Number.MAX_SAFE_INTEGER;

function isValidScore(n) {
  return Number.isFinite(n) && !Number.isNaN(n) && n >= 0;
}

/**
 * FR-5: kalıcı en yüksek skoru okur. Değer yoksa/bozuksa/erişilemezse 0 döner (asla throw etmez).
 * @returns {number}
 */
function getHighScore() {
  try {
    if (typeof localStorage === 'undefined' || localStorage === null) return 0;
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = parseInt(raw, 10);
    if (!isValidScore(n)) return 0;
    return Math.min(n, MAX_SAFE);
  } catch (e) {
    return 0;
  }
}

/**
 * FR-5: kalıcı en yüksek skoru yazar. Geçersiz (NaN/negatif) değer YAZILMAZ. Depolama
 * erişilemezse (throw) sessizce false döner (SEC-3 — exception dışarı sızmaz).
 * @param {number} n
 * @returns {boolean} yazma başarılıysa true.
 */
function setHighScore(n) {
  try {
    const v = parseInt(n, 10);
    if (!isValidScore(v)) return false;
    if (typeof localStorage === 'undefined' || localStorage === null) return false;
    localStorage.setItem(STORAGE_KEY, String(Math.min(v, MAX_SAFE)));
    return true;
  } catch (e) {
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getHighScore, setHighScore, STORAGE_KEY };
}
