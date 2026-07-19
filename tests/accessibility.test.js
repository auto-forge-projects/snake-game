'use strict';
// tests/accessibility.test.js — TASK-008: NFR-5 (erişilebilirlik/klavye/kontrast),
// SEC-4 (DOM injection'sız istemci — statik kod taraması).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const INDEX_HTML = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
const GAME_JS_SRC = fs.readFileSync(path.join(PUBLIC_DIR, 'game.js'), 'utf8');
const STORAGE_JS_SRC = fs.readFileSync(path.join(PUBLIC_DIR, 'storage.js'), 'utf8');
const STYLES_CSS = fs.readFileSync(path.join(PUBLIC_DIR, 'styles.css'), 'utf8');

// WCAG 2.1 göreli parlaklık + kontrast oranı (bkz. https://www.w3.org/TR/WCAG21/#contrast-minimum).
function hexToRgb(hex) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
  if (!m) throw new Error(`geçersiz hex renk: ${hex}`);
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}
function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : ((cs + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
function contrastRatio(hexA, hexB) {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

test('NFR-5: --color-bg / --color-fg arasındaki kontrast oranı ≥4.5:1 (WCAG 2.1 AA)', () => {
  const bg = /--color-bg:\s*(#[\da-f]{6})/i.exec(STYLES_CSS);
  const fg = /--color-fg:\s*(#[\da-f]{6})/i.exec(STYLES_CSS);
  assert.ok(bg && fg, 'styles.css içinde --color-bg ve --color-fg CSS custom property olarak tanımlı olmalı');
  const ratio = contrastRatio(bg[1], fg[1]);
  assert.ok(ratio >= 4.5, `kontrast oranı ${ratio.toFixed(2)}:1, ≥4.5:1 olmalı`);
});

test('NFR-5: skor için aria-live="polite", oyun sonu için aria-live="assertive" bölgesi var', () => {
  assert.match(INDEX_HTML, /id="score"[^>]*aria-live="polite"/, 'skor polite aria-live ile duyurulmalı');
  assert.match(INDEX_HTML, /id="status"[^>]*aria-live="assertive"/, 'oyun sonu assertive aria-live ile duyurulmalı');
});

test('NFR-5: başlat/tekrar-oyna kontrolleri gerçek <button> (klavye ile Enter/Space erişilebilir)', () => {
  assert.match(INDEX_HTML, /<button[^>]*id="start-btn"/);
  assert.match(INDEX_HTML, /<button[^>]*id="restart-btn"/);
});

test('SEC-4: game.js/storage.js kaynağında innerHTML/outerHTML/document.write/eval/new Function YOK', () => {
  const forbidden = /innerHTML|outerHTML|document\.write|(?<!\/\/.*)\beval\(|new Function\(/;
  assert.doesNotMatch(GAME_JS_SRC, forbidden, 'game.js dinamik HTML enjeksiyonu/eval kullanmamalı');
  assert.doesNotMatch(STORAGE_JS_SRC, forbidden, 'storage.js dinamik HTML enjeksiyonu/eval kullanmamalı');
});
