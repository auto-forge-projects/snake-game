# 11 — Test Planı: snake-game

- Tarih: 2026-07-19 | Mod: AUTOPILOT | Profil: LITE

## Kritik senaryolar (FR kabul kriterlerinden türetilmiş)

| # | Senaryo | Kaynak FR | Test dosyası |
|---|---------|-----------|---------------|
| S1 | Sayfa ilk açıldığında yılan görünür ama hareket etmez (idle) | FR-1 | `tests/game.test.js` |
| S2 | Ok tuşu/"Başlat" ile oyun başlar | FR-1 | `tests/bootstrap.test.js` |
| S3 | Yön değişimi ≤1 adımda uygulanır; 180° ters yön yok sayılır | FR-2 | `tests/direction.test.js` |
| S4 | Yalnız klavye ile tüm akış (başlat/oyna/yeniden başlat) tamamlanır | FR-2 | `tests/bootstrap.test.js` |
| S5 | Yem yenince yılan uzar, skor +1, yeni yem gövde dışında | FR-3 | `tests/food.test.js` |
| S6 | Duvara/kendine çarpınca oyun biter, final skor gösterilir | FR-4 | `tests/collision.test.js`, `tests/bootstrap.test.js` |
| S7 | Oyun-sonu `aria-live="assertive"` ile duyurulur | FR-4, NFR-5 | `tests/accessibility.test.js`, `tests/integration/http-e2e.test.js` |
| S8 | En yüksek skor `localStorage`'a yazılır ve sayfa yenilense de okunur | FR-5 | `tests/storage.test.js`, `tests/bootstrap.test.js` |
| S9 | "Tekrar Oyna" ile skor sıfırlanır, en yüksek skor korunur | FR-6 | `tests/restart.test.js` |
| S10 | Gerçek HTTP sunucusundan servis edilen `index.html`'in DOM id'leri `game.js`'in beklentileriyle eşleşir (HTML↔JS drift önleme) | FR-1..6 (entegrasyon) | `tests/integration/http-e2e.test.js` |
| S11 | Bilinmeyen route/dotfile hiçbir zaman 200 dönmez | NFR-3, SEC-2/7 | `tests/security-headers.test.js`, `tests/integration/http-e2e.test.js` |
| S12 | Güvenlik başlıkları (CSP/nosniff/frame-options) her yanıtta set edilir | NFR-4 (destekleyici) | `tests/security-headers.test.js` |

## Kapsam kararları

- **Kapsam İÇİNDE:** Faz 9'un birim testleri (39) + bu fazda eklenen 5 entegrasyon testi (`tests/integration/http-e2e.test.js`) — toplam 44 test, gerçek HTTP sunucusu (supertest) üzerinden.
- **Kapsam DIŞINDA (ve neden):**
  - **Gerçek tarayıcı E2E (Playwright/Cypress):** Sıfır-bağımlılık hedefi (NFR-7, DL-04-001) + LITE artefakt bütçesi; `requestAnimationFrame`/DOM olayları sahte-DOM (`tests/bootstrap.test.js`) ile zaten uçtan uca sürülüyor. Gerçek tarayıcı görsel/etkileşim testi Faz 15 teknik borcuna not düşülür (bkz. DL-11-001).
  - **NFR-2 (60 FPS) gerçek performans ölçümü:** Otomatik testte tarayıcı olmadan ölçülemez; fixed-step mantığı (`stepMs` sabiti, DL-05-001) tasarım-zamanı garanti sağlar, çalışma-zamanı ölçüm manuel/gerçek tarayıcı gözlemine bırakılır.
  - **Çoklu tarayıcı uyumluluğu (NFR-6):** Otomatik test kapsamı dışında; standart Web API'leri (Canvas 2D, localStorage) kullanıldığından düşük risk kabul edildi.

## Kalite kapısı raporu
- "Kritik senaryolar %100" → ✅ GEÇTİ — S1..S12 hepsi mevcut testlerle kapsanıyor, 44/44 test geçiyor (bkz. `results.md`).
