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
 * FR-2: klavye yön isteğini değerlendirir. 180° (tam ters) istek YOK SAYILIR (yılan kendi
 * üzerine anında çarpışmaz); aksi halde istenen yön kabul edilir. `next` tamponuna yazılır,
 * step() bir sonraki adımda uygular (NFR-1: giriş → yön değişimi ≤100ms).
 * @param {{x:number,y:number}} currentDir aktif yön
 * @param {{x:number,y:number}} requestedDir istenen yön
 */
function turn(currentDir, requestedDir) {
  const isOpposite = requestedDir.x === -currentDir.x && requestedDir.y === -currentDir.y;
  return isOpposite ? currentDir : requestedDir;
}

function occupiesCell(cells, cell) {
  return cells.some((c) => c.x === cell.x && c.y === cell.y);
}

/**
 * FR-3: yılan gövdesi DIŞINDA rastgele bir ızgara hücresi üretir. `rng` enjekte edilebilir
 * (varsayılan Math.random) — deterministik test için.
 * @param {{x:number,y:number}[]} snake
 * @param {{cols:number,rows:number}} grid
 * @param {() => number} [rng]
 */
function spawnFood(snake, grid, rng = Math.random) {
  const maxAttempts = grid.cols * grid.rows * 4;
  let candidate;
  let attempts = 0;
  do {
    candidate = { x: Math.floor(rng() * grid.cols), y: Math.floor(rng() * grid.rows) };
    attempts += 1;
  } while (occupiesCell(snake, candidate) && attempts < maxAttempts);
  return candidate;
}

/** FR-4: baş ızgara sınırı dışına çıktı mı? */
function isOutOfBounds(pos, grid) {
  return pos.x < 0 || pos.x >= grid.cols || pos.y < 0 || pos.y >= grid.rows;
}

/** FR-4: baş, verilen gövde hücrelerinden biriyle çakışıyor mu? */
function isSelfCollision(head, bodyCells) {
  return occupiesCell(bodyCells, head);
}

/**
 * TASK-002..005: fixed-step mantık adımı. status !== 'running' iken no-op (idle/gameover'da
 * yılan hareket etmez — FR-4 AC: oyun bitince döngü durur). Adım başında kuyruklanmış `next`
 * yönü `dir`'e uygulanır. Baş duvara/kendi gövdesine çarparsa (FR-4) status='gameover' olur ve
 * final skor korunur (yılan/skor bir daha değişmez). Aksi halde yılanın başı yem hücresine
 * girerse (FR-3) bir birim uzar, skor 1 artar, yeni yem gövde dışında üretilir; aksi halde
 * kuyruk düşer (uzunluk sabit kalır).
 */
function step(state) {
  if (state.status !== 'running') return state;
  const dir = state.next;
  const head = state.snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };
  const ate = newHead.x === state.food.x && newHead.y === state.food.y;
  // Kendine-çarpışma kontrolü, bu adımda vücutta KALACAK hücrelere göre yapılır: yem
  // yenmiyorsa kuyruk aynı adımda ayrılır (klasik Snake kuralı — kuyruğun boşalttığı hücreye
  // girmek çarpışma sayılmaz), yem yeniyorsa kuyruk yerinde kalır.
  const bodyAfterMove = ate ? state.snake : state.snake.slice(0, -1);
  if (isOutOfBounds(newHead, state.grid) || isSelfCollision(newHead, bodyAfterMove)) {
    return { ...state, status: 'gameover' };
  }
  const grown = [newHead, ...state.snake];
  const newSnake = ate ? grown : grown.slice(0, -1);
  const score = ate ? state.score + 1 : state.score;
  const food = ate ? spawnFood(newSnake, state.grid) : state.food;
  return { ...state, dir, next: dir, snake: newSnake, score, food };
}

/**
 * FR-6: "Tekrar Oyna" — yılanı/skoru başlangıç durumuna sıfırlar ve oyunu HEMEN yeniden
 * başlatır (bekletmeden); en yüksek skor (`best`) korunur/taşınır.
 * @param {number} [best] korunacak en yüksek skor.
 */
function resetState(best = 0) {
  return start(createInitialState(best));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GRID,
    STEP_MS,
    createInitialState,
    start,
    turn,
    spawnFood,
    isOutOfBounds,
    isSelfCollision,
    step,
    resetState,
  };
}

if (typeof document !== 'undefined') {
  // Tarayıcı bootstrap'ı sonraki task'larda (input/render/aria-live) doldurulacak.
}
