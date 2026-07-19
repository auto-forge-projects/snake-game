'use strict';
// public/game.js — Snake oyun mantığı (TASK-002..007). Saf fonksiyonlar (createInitialState,
// start, turn, step, spawnFood, resetState) DOM/Canvas'tan bağımsızdır ve hem tarayıcıda
// (<script> ile global scope) hem Node `node:test` içinde (require) çalışır (roll.js
// kalıbındaki çift-ortam export — bkz. decisions/DL-09-001.md).
//
// Render/giriş/aria-live köprüsü (bootstrap) yalnız `document` tanımlıyken (tarayıcıda) çalışır;
// Node test ortamında bu blok atlanır (bkz. dosya sonu).

const GRID = { cols: 20, rows: 20, cell: 20 };
const STEP_MS = 100; // NFR-1: giriş → yön değişimi gecikmesi ≤100ms

/**
 * FR-1: sabit başlangıç konumu/yönünde yeni bir GameState üretir. status='idle' —
 * ızgara/yılan görünür ama step() hareket ettirmez (kullanıcı eylemi bekler).
 * @param {number} [best] önceki en yüksek skor (storage.js'ten) — restart'ta korunur.
 */
function createInitialState(best = 0) {
  return {
    grid: { ...GRID },
    snake: [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ],
    dir: { x: 1, y: 0 },
    next: { x: 1, y: 0 },
    food: { x: 15, y: 10 },
    score: 0,
    best,
    status: 'idle',
    stepMs: STEP_MS,
    acc: 0,
  };
}

/** FR-1: idle → running geçişi (Başlat butonu / herhangi bir ok tuşu). */
function start(state) {
  if (state.status !== 'running') return { ...state, status: 'running' };
  return state;
}

/**
 * TASK-002: fixed-step mantık adımı. status !== 'running' iken no-op (idle/gameover'da
 * yılan hareket etmez). Yem/çarpışma mantığı sonraki task'larda eklenir.
 */
function step(state) {
  if (state.status !== 'running') return state;
  const dir = state.dir;
  const head = state.snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };
  const newSnake = [newHead, ...state.snake.slice(0, -1)];
  return { ...state, snake: newSnake };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GRID, STEP_MS, createInitialState, start, step };
}

if (typeof document !== 'undefined') {
  // Tarayıcı bootstrap'ı sonraki task'larda (input/render/aria-live) doldurulacak.
}
