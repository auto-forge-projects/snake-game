# 15 — Bakım: snake-game

- Tarih: 2026-07-19 | Mod: AUTOPILOT
- Bu dosya ÜRÜNÜN teknik borcunu izler; fabrikanın eksikleri `AUTOFORGE-FEEDBACK.md`'ye.

## Bilinen sorunlar
- CI/mekanik kapı, RAF bootstrap testinin rastgele yem respawn'una bağlı non-deterministik iddiası nedeniyle ~%2,5 olasılıkla ara sıra kırmızıya döner (TD-1).
- Docker imajı hedef bütçeyi (NFR-7 ≤150MB) aşıyor (TD-2).

## Teknik borç (kalite kapısı: önceliklendirilmiş)
| # | Borç | Kaynak (DL/review bulgusu) | Öncelik (P1/P2/P3) | Not |
|---|------|---------------------------|--------------------|-----|
| TD-1 | Flaky test: `tests/bootstrap.test.js:113-134` rastgele yem respawn'una bağlı non-deterministik skor iddiası (~%2,5 red) | Faz 10 review F1 (Major), DL-10-001 | **P1** | Testte `global.Math.random`'ı sabitle veya kesin-skor iddiasını gevşet. CI'ı ara sıra kırdığı için en yüksek öncelik. |
| TD-2 | Docker imajı 241MB, NFR-7 (≤150MB) bütçesini aşıyor | Faz 12 DL-12-001 | P2 | Multi-stage build / `node:22-alpine` katman optimizasyonu, `npm ci --omit=dev` doğrulaması. |
| TD-3 | rAF döngüsünde max-delta/kare-başına-adım tavanı yok — sekme arka plana alınıp dönülünce yılan bir anda çok hücre atlayabilir | Faz 10 review F2 (Minor), DL-10-001 | P2 | `public/game.js:220-240` içine `delta = Math.min(delta, 250)` benzeri clamp. |
| TD-4 | Kuyruk-boşaltma hücresine girmenin çarpışma sayılmadığı pozitif senaryo doğrudan test edilmiyor (kod doğru, regresyon koruması eksik) | Faz 10 review (test kalitesi değerlendirmesi) | P2 | `tests/collision.test.js`'e ek senaryo. |
| TD-5 | `isValidScore`'da gereksiz `!Number.isNaN(n)` dalı (ölü dal, storage.js branch cov %86,67) | Faz 10 review F3 (Nit) | P3 | `Number.isFinite(n) && n >= 0` yeterli. |
| TD-6 | Canvas render renkleri (`#161b22` vb.) `styles.css` custom property'lerinden elle kopyalanmış — drift riski | Faz 10 review F4 (Nit) | P3 | Ortak sabit veya `getComputedStyle` ile tek kaynak. |
| TD-7 | `storage.js` `parseInt` gevşek ayrıştırma ("42abc"→42); etki=0 ama fazla toleranslı | Faz 10 review F5 (Nit) | P3 | İstenirse `Number()`+`Number.isInteger` katı ayrıştırma. |
| TD-8 | `start()` yalnız `!== 'running'` kontrol eder, semantik gevşek (mevcut kablolamada erişilemez) | Faz 10 review F6 (Nit) | P3 | `status === 'idle'` guard'ı veya niyeti belgele. |
| TD-9 | Gameover sonrası doğrudan tuşla restart yok (yalnız Tab+Enter ile erişilebilir) | Faz 10 review F7 (Nit) | P3 | İsteğe bağlı: `status==='gameover'` iken bir tuş restart tetiklesin. |
| TD-10 | "Enter'a basın" ipucu yanıltıcı (Başlat'ta autofocus yok) | Faz 10 review F8 (Nit) | P3 | Başlat'a `autofocus` ekle veya metni düzelt. |
| TD-11 | Statik varlık bozulması (index.html eksik/hatalı) health check tarafından ayırt edilmiyor | Faz 14 DL-14-001 | P3 | İçerik-doğrulama probe'u (opsiyonel, LITE ölçekte gerekli değil). |
| TD-12 | Playwright/gerçek-tarayıcı E2E ve NFR-2 (FPS) ölçümü kapsam dışı | Faz 11 DL-11-001 | P3 | STANDARD/FULL profile geçişte veya kullanıcı talebiyle eklenebilir. |

## Bağımlılık güncelleme planı
- Tek prod bağımlılık: `express` (package-lock.json commit'li, lockfileVersion 3). Dependabot bu ölçekte manuel takip yeterli (ayda bir `npm outdated` + `npm audit`); ayrı otomasyon LITE profilde gereksiz.
- Node.js runtime: `node:22-alpine` (Dockerfile) — Node LTS döngüsünü takip et, majör sürüm geçişinde `npm test` + Docker build doğrulaması yeter.

## Bakım ritmi
- Her sürüm öncesi: `npm audit --audit-level=high` + `npm test` (coverage regresyon kontrolü).
- TD-1 (P1) bir sonraki geliştirme oturumunda ele alınmalı — CI güvenilirliğini doğrudan etkiliyor.
- Aylık: `npm outdated` kontrolü, imaj boyutu (TD-2) yeniden ölçümü.

## Kalite kapısı raporu
- "Teknik borç önceliklendirilmiş" → ✅ (12 borç, her biri Faz/DL/review bulgusuna izlenebilir; 1×P1, 3×P2, 8×P3)
