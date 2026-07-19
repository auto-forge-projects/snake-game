# 10 — Code Review: PR-1 (snake-game)

- Tarih: 2026-07-19 | Mod: AUTOPILOT | İnceleyen: Opus (code-reviewer, blind) — **yazan Sonnet (Faz 9) ile FARKLI (Author ≠ Reviewer ✅)**
- İncelenen: `src/server.js`, `public/{index.html,styles.css,game.js,storage.js}`, `tests/*.test.js` (Faz 9 commit'leri; `tests/integration/` = Faz 11 paralel işi, kapsam DIŞI) · Referans: docs/03, docs/05, docs/07

## Yöntem
Beş kaynak dosya + 10 kök test dosyası elle satır satır okundu. Bağımsız çalıştırma: `npm test` → 39/39 yeşil; `npm run test:coverage` (yalnız Faz 9 testleri) → line 99.14% / branch 95.83% / func 96.15% (game.js 100%, storage.js 100% line / 86.67% branch, server.js 94.55% — kapsanmayan 51-53 = `app.listen` bootstrap'ı, kabul edilebilir). `npm audit --audit-level=high` → 0 zafiyet. TDD kanıtı: her TASK için `test(red)`→`feat(green)` commit çifti mevcut (git log doğrulandı). **Flakiness bulundu:** bootstrap RAF testi 40 koşumun 1'inde (~%2,5) `actual: 2, expected: 1` ile düştü (aşağıda F1).

## Bulgular
| # | Severity | Dosya:Satır | Bulgu | Aksiyon |
|---|----------|-------------|-------|---------|
| F1 | **Major** | tests/bootstrap.test.js:113-134 | **Flaky test.** RAF döngü testi `setHighScore.lastCall === 1` ve `best === '1'` bekler. Ama yılan (15,10)'daki yemi yedikten sonra yeni yem `spawnFood(newSnake, grid)` ile **default `Math.random`** kullanılarak üretilir; bu yem yılanın ileri yolundaki (16-19, satır 10) boş bir hücreye düşebilir → ikinci yeme → skor 2. 80 koşumda tekrar üretildi (`actual: 2, expected: 1`). Faz 9 mekanik kapısı VE Faz 12 CI ikisi de `npm test` koştuğu için pipeline'ı ~%2,5 olasılıkla KIRMIZIYA çevirir. | Testi deterministik yap: `global.Math.random`'ı test içinde sabitle (yeniden doğan yem yolun DIŞINA düşecek şekilde) VEYA rastgele respawn'a bağlı kesin skor iddiasını kaldır. Ürün kodu DOĞRU — kusur yalnız testte. |
| F2 | Minor | public/game.js:220-240 | rAF döngüsünde max-delta / kare-başına-adım sınırı yok. Sekme arka plana alınıp dönülünce `delta` çok büyük olur → `while (acc >= stepMs)` tek karede onlarca adım koşar → yılan bir anda çok hücre atlar (muhtemelen anında gameover; NFR-2 takılma). | `delta = Math.min(delta, 250)` gibi clamp veya kare-başına adım tavanı ekle. |
| F3 | Nit | public/storage.js:10-12 | `isValidScore`'daki `!Number.isNaN(n)` gereksiz — `Number.isFinite(n)` zaten NaN'ı eler → ölü dal (storage.js branch cov %86,67'nin sebebi). | `Number.isFinite(n) && n >= 0` yeterli; gereksiz koşulu kaldır. |
| F4 | Nit | public/game.js:169-176 | Canvas `render()` renkleri (`#161b22`,`#3fb950`,`#f85149`) elle gömülü — styles.css CSS custom property'lerini kopyalıyor → kayma (drift) riski. | Ortak sabit/`getComputedStyle` ile tek kaynaktan al. |
| F5 | Nit | public/storage.js:21 | `parseInt(raw,10)` "42abc"→42 gibi gevşek ayrıştırır. Etki=0 (istemci-kontrollü, tasarımca güvenilmez) ama fazla toleranslı. | İstenirse `Number()`+`Number.isInteger` ile katı ayrıştırma. |
| F6 | Nit | public/game.js:38-41 | `start()` yalnız `!== 'running'` kontrol eder → `start(gameover)` biten oyunu diriltir. Mevcut kablolamada erişilemez ama semantik gevşek. | `status === 'idle'` guard'ı veya niyeti belgele. |
| F7 | Nit | public/game.js:203-209 | Gameover sonrası ok tuşları etkisiz; yeniden başlatma yalnız butona Tab ile. Tam klavye-erişilebilir (Tab+Enter, NFR-5 karşılanır) ama doğrudan tuş yok. | İsteğe bağlı: `status==='gameover'` iken bir tuş restart tetiklesin. |
| F8 | Nit | public/index.html:23, game.js:203 | İpucu "Enter'a basın" der ama Enter yalnız Başlat odaklıyken çalışır (autofocus yok). Ok tuşları güvenilir başlatır. | Başlat'a `autofocus` ekle veya ipucu metnini düzelt. |

**Blocker: 0 · Critical: 0 · Major: 1 · Minor: 1 · Nit: 6**

## İzlenebilirlik (FR ↔ kod)
| FR | Karşılayan modül | Durum |
|----|------------------|-------|
| FR-1 Başlatma | game.js `createInitialState`(idle)/`start`, bootstrap `beginGame` + ok-tuşuyla-başlat | ✅ Kapsandı + test (game/bootstrap) |
| FR-2 Klavye + 180° engeli | game.js `turn`, `KEY_TO_DIR`, `handleDirectionKey` (state.dir'e göre karşılaştırır → klasik ters-dönüş bug'ı YOK) | ✅ Kapsandı + test (direction) |
| FR-3 Yem/büyüme/skor | game.js `step` ate-dalı, `spawnFood` (gövde-dışı, retry) | ✅ Kapsandı + test (food) |
| FR-4 Çarpışma/oyun sonu | game.js `isOutOfBounds`,`isSelfCollision`,`step` gameover; kuyruk-boşaltma kuralı doğru (`bodyAfterMove`) | ✅ Kapsandı + test (collision) |
| FR-5 Skor kalıcılığı | storage.js `getHighScore`/`setHighScore`, bootstrap `handleGameOver` | ✅ Kapsandı + test (storage) |
| FR-6 Yeniden başlatma | game.js `resetState`, bootstrap `restartBtn` | ✅ Kapsandı + test (restart/bootstrap) |
| FR-7 Kapsam sınırı | Çok-oyunculu/zorluk/dokunmatik YOK (inceleme ile doğrulandı) | ✅ Yapısal (kapsam-dışı özellik yok) |

## Güvenlik (SEC-*) uygulama kontrolü
- SEC-1: ✅ (server.js:9-21 — CSP `default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'`, `X-Content-Type-Options:nosniff`, `X-Frame-Options:DENY`, `Referrer-Policy:no-referrer`, `x-powered-by` kapalı; security-headers.test.js doğrular)
- SEC-2: ✅ (server.js:26-42 — `express.static` yalnız `public/`, `dotfiles:'ignore'`, `redirect:false`; tek ek route `GET /health`; catch-all 404; dotfile→404 testi geçer)
- SEC-3: ✅ (storage.js — try/catch + `parseInt` + NaN/negatif→0 + `MAX_SAFE` clamp + Safari-özel-mod throw'da zarif `false`/`0`; 5 hedefli test)
- SEC-4: ✅ (game.js bootstrap yalnız `textContent`; `innerHTML`/`eval`/`new Function` YOK — accessibility.test.js statik-tarama ile kanıtlar)
- SEC-5: ✅ (kısmi/Faz 9 payı — `package-lock.json` commit'li lockfileVersion 3, tek prod bağımlılık `express`, `npm audit`=0; CI `--audit-level=high` zorunluluğu Faz 12'ye köprü)
- SEC-6: ⏸️ **Faz 12 kapsamı** — Dockerfile/.dockerignore henüz YOK (Faz 12/CI-CD artefaktı; faz tablosu Faz 12=Dockerfile). Faz 9 gap'ı DEĞİL.
- SEC-7: ✅ (server.js:39-48 — bilinmeyen route sade `Not Found`, 500 sabit `Internal Server Error`, stack/iç-yol sızmaz; 2 test)
- SEC-8: ⏸️ **Faz 12 kapsamı** — CI least-privilege/SHA-pin Faz 12'de zorlanır; Faz 9 payı (lockfile) mevcut. .dockerignore Faz 12'de eklenecek.

## Test kalitesi değerlendirmesi
Senaryo kalitesi **güçlü** (coverage sayısından bağımsız): testler saf fonksiyonları DOM'dan ayırıp davranışsal kenar durumları hedefliyor — idle'da `step()` no-op, 180° reddi, **kuyruk-boşaltma çarpışma nüansı**, gameover sonrası no-op, storage'ın bozuk/NaN/negatif/MAX_SAFE/Safari-throw düşüşleri, güvenlik başlıkları, dotfile-404, 500-handler'ın izole edilmiş doğrulaması. TDD red→green commit disiplini örnek niteliğinde. **Zayıflıklar:** (1) F1 — bootstrap RAF testi rastgele respawn'a bağlı non-deterministik iddia içeriyor (flaky, pipeline'ı ara ara kırar) — bu, test paketinin en zayıf halkası. (2) Kuyruğun BOŞALTTIĞI hücreye girmenin çarpışma SAYILMADIĞI pozitif senaryo (klasik Snake kuralı) doğrudan test edilmemiş (kod doğru ama regresyon koruması eksik). (3) NFR-1 giriş→yön ≤100ms zamanlaması yalnız yapısal (`stepMs=100`) doğrulanıyor — kabul edilebilir (zamanlama birim-testte zor).

## Karar
**Kapı GEÇTİ** (Blocker/Critical = 0). Ürün kodu FR-1..FR-7'yi doğru karşılıyor, SEC-1..5/7 uygulanmış (SEC-6/8 Faz 12'ye ait). Kalan bulguların yeri:
- **F1 (Major) → Faz 9 geri besleme (öncelik 1, KAPANIŞ ÖNCESİ):** Flaky test Faz 12 "Pipeline yeşil" kapısını ara ara kıracağı için Faz 11/12 finalize edilmeden düzeltilmeli. LITE reviewLoop eşiği `{critical,1}` olduğundan iterasyon zorunlu DEĞİL, ancak CI güvenilirliği için tavsiye edilir (bkz. DL-10-001).
- **F2 (Minor) → Faz 9 geri besleme (öncelik 2) veya Faz 15 borç** (max-delta clamp).
- **F3-F8 (Nit) → Faz 15 teknik borç** (kayıtlı, dayatılmaz).

## Kalite kapısı raporu
- "Blocker/Critical bulgu = 0" → ✅ (Blocker: 0, Critical: 0)
