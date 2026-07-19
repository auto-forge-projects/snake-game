'use strict';
// tests/bootstrap.test.js — TASK-009: tarayıcı bootstrap köprüsünün (public/game.js `document`
// bloğu, TASK-008) entegrasyon testleri. jsdom YOK (sıfır-bağımlılık hedefi) — minimal sahte
// DOM/RAF ile yalnız dışa açık yüzeyler (keydown, buton click, requestAnimationFrame callback,
// DOM element metinleri) üzerinden uçtan uca sürülür; iç closure'lara doğrudan erişim yoktur.
const { test } = require('node:test');
const assert = require('node:assert/strict');

function fakeElement(overrides = {}) {
  const el = { hidden: false, textContent: '', _listeners: {}, ...overrides };
  el.addEventListener = (evt, cb) => {
    (el._listeners[evt] ||= []).push(cb);
  };
  return el;
}

function installFakeBrowser(highScore) {
  const els = {
    board: fakeElement({ width: 400, height: 400, getContext: () => ({ fillRect() {} }) }),
    score: fakeElement(),
    best: fakeElement(),
    status: fakeElement(),
    'start-btn': fakeElement(),
    'restart-btn': fakeElement(),
  };
  const docListeners = {};
  global.document = {
    getElementById: (id) => els[id],
    addEventListener: (evt, cb) => {
      (docListeners[evt] ||= []).push(cb);
    },
  };
  const rafQueue = [];
  global.requestAnimationFrame = (cb) => rafQueue.push(cb);
  global.getHighScore = () => highScore;
  global.setHighScore = (n) => {
    global.setHighScore.lastCall = n;
  };
  return { els, docListeners, rafQueue };
}

function loadGameFresh() {
  const resolved = require.resolve('../public/game.js');
  delete require.cache[resolved];
  require(resolved);
}

function cleanupFakeBrowser() {
  delete global.document;
  delete global.requestAnimationFrame;
  delete global.getHighScore;
  delete global.setHighScore;
}

test('start() zaten running olan durumu değiştirmeden aynen döndürür (no-op dalı)', () => {
  const { createInitialState, start } = require('../public/game.js');
  const running = start(createInitialState());
  const again = start(running);
  assert.equal(again, running, 'ikinci start() çağrısı aynı referansı/aynı durumu döndürmeli');
});

test('TASK-009: bootstrap ilk yüklemede HUD idle durumla kurulur ve bir RAF çerçevesi zamanlanır', () => {
  const { els, rafQueue } = installFakeBrowser(7);
  try {
    loadGameFresh();
    assert.equal(els.score.textContent, '0');
    assert.equal(els.best.textContent, '7', 'getHighScore() best olarak taşınmalı');
    assert.equal(rafQueue.length, 1, 'ilk requestAnimationFrame(loop) zamanlanmış olmalı');
  } finally {
    cleanupFakeBrowser();
  }
});

test('TASK-009: ok tuşu idle iken oyunu başlatır (beginGame) — start/restart gizlenir', () => {
  const { docListeners, els } = installFakeBrowser(0);
  try {
    loadGameFresh();
    const keydown = docListeners.keydown[0];
    let prevented = false;
    keydown({ key: 'ArrowRight', preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true, 'eşlenen yön tuşunda preventDefault çağrılmalı');
    assert.equal(els['start-btn'].hidden, true);
    assert.equal(els['restart-btn'].hidden, true);
    assert.equal(els.status.textContent, '');
  } finally {
    cleanupFakeBrowser();
  }
});

test('TASK-009: eşlenmeyen tuş yok sayılır (preventDefault çağrılmaz, throw etmez)', () => {
  const { docListeners } = installFakeBrowser(0);
  try {
    loadGameFresh();
    const keydown = docListeners.keydown[0];
    assert.doesNotThrow(() => keydown({ key: 'Escape', preventDefault: () => { throw new Error('çağrılmamalı'); } }));
  } finally {
    cleanupFakeBrowser();
  }
});

test('TASK-009: başlat butonuna tıklama oyunu başlatır (klavyeyle aynı yol, beginGame)', () => {
  const { els } = installFakeBrowser(0);
  try {
    loadGameFresh();
    els['start-btn']._listeners.click[0]();
    assert.equal(els['start-btn'].hidden, true);
    assert.equal(els['restart-btn'].hidden, true);
  } finally {
    cleanupFakeBrowser();
  }
});

test('TASK-009: RAF döngüsü adım adım ilerletir, duvara çarpınca oyunu bitirir ve en yüksek skoru günceller', () => {
  const { els, docListeners, rafQueue } = installFakeBrowser(0);
  try {
    loadGameFresh();
    // Oyunu başlat (idle -> running).
    docListeners.keydown[0]({ key: 'ArrowRight', preventDefault() {} });

    // Yılan (10,10)'dan sağa doğru hareket eder; ızgara 20 sütun — tam 10 adımda
    // duvara çarpar (yoldaki yem TASK-003/004 mantığıyla yenir ama x-ilerlemesini etkilemez).
    let ts = 0;
    let steps = 0;
    while (els.status.textContent === '' && steps < 30) {
      ts += 100;
      const loop = rafQueue[rafQueue.length - 1];
      loop(ts);
      steps += 1;
    }

    assert.ok(els.status.textContent.startsWith('Oyun Bitti!'), 'duvara çarpınca oyun-sonu metni gösterilmeli');
    assert.equal(els['restart-btn'].hidden, false, 'oyun bitince tekrar-oyna görünür olmalı');
    assert.equal(global.setHighScore.lastCall, 1, 'yem yenip skor best(0)ı geçince en yüksek skor güncellenmeli');
    assert.equal(els.best.textContent, '1');

    // Tekrar Oyna: resetState HEMEN yeniden başlatır (status=running) — ek tuşa gerek yok.
    els['restart-btn']._listeners.click[0]();
    assert.equal(els.status.textContent, '');
    assert.equal(els.score.textContent, '0');
    ts += 100;
    assert.doesNotThrow(() => rafQueue[rafQueue.length - 1](ts), 'restart sonrası döngü tekrar sorunsuz ilerlemeli');
  } finally {
    cleanupFakeBrowser();
  }
});
