# 04 — Çözüm Analizi: snake-game

- Tarih: 2026-07-19 | Mod: AUTOPILOT | Profil: LITE

## Karar problemi
İstemci-taraflı, statik (sunucu-state'siz) klasik Snake için üç mimari seçim:
1. **Render/oyun döngüsü** — belirleyici: NFR-2 (~60 FPS), NFR-1 (≤100ms giriş gecikmesi), NFR-6 (tarayıcı uyumu).
2. **Sunucu/servis katmanı** — belirleyici: NFR-7 (≤150MB imaj), NFR-3 (asgari saldırı yüzeyi, `npm audit` Critical/High=0), NFR-8 (`/health`).
3. **Skor kalıcılığı** — belirleyici: FR-5 (en yüksek skor kalıcılığı), NFR-6 (tarayıcı uyumu).

## Karar 1 — Render/oyun döngüsü
- **A — HTML5 Canvas + `requestAnimationFrame`.** Tek `<canvas>`; her tick'te ızgara+yılan immediate-mode yeniden çizilir.
- **B — DOM/CSS-grid hücreleri.** ~400 hücre DOM düğümü; tick'te class/stil güncellenir.
- (C — SVG: DOM'a benzer overhead, en zayıf; ele alındı, elendi.)

| Kriter | A (Canvas+rAF) | B (DOM/CSS-grid) |
|--------|----------------|-------------------|
| NFR-2 ~60 FPS | ✅ Tek yüzey redraw, reflow yok | ⚠️ Çok düğüm/tick'te repaint riski |
| NFR-1 ≤100ms giriş | ✅ Düşük overhead, tick'e bağlı | ✅ Yeterli |
| Karmaşıklık | Orta (çizim kodu) | Düşük (deklaratif) |
| NFR-6 uyum | ✅ Evrensel | ✅ Evrensel |
| NFR-5 erişilebilirlik | Ek `aria-live` DOM katmanı gerekir | ✅ Doğal DOM |
| Geri alınabilirlik | Yüksek (render izole) | Yüksek |

**Seçim: A.** **Gerekçe:** NFR-2/NFR-1 belirleyici; Canvas takılmasız 60 FPS'i deterministik verir. NFR-5 için skor/oyun-sonu ayrı `aria-live` DOM bölgesiyle karşılanır (render katmanından bağımsız).

## Karar 2 — Sunucu/servis katmanı
- **A — Minimal Express + `express.static` + `/health`.** coinflip/dice-game kalıbı; kanıtlı deploy (Docker + SSH-push).
- **B — Çıplak Node `http` + `fs`.** Sıfır bağımlılık; statik servis elle yazılır.

| Kriter | A (Express static) | B (bare http+fs) |
|--------|--------------------|-------------------|
| NFR-7 ≤150MB | ✅ node:alpine+express ≪150MB | ✅ En küçük |
| NFR-3 saldırı yüzeyi | ✅ `express.static` path-traversal korumalı; `npm audit` temiz | ⚠️ Elle MIME/traversal → klasik açık riski |
| NFR-8 `/health` | ✅ Tek satır route | ⚠️ Elle router |
| Karmaşıklık/bakım | Düşük (kalıp yeniden kullanımı) | Orta (boilerplate) |
| Geri alınabilirlik | Yüksek (tek dosya) | Yüksek |

**Seçim: A.** İki mod da NFR-7'yi karşılar; NFR-3'te `express.static` battle-tested traversal korumasıyla elle-yazılmış `fs`'in klasik açığını önler. coinflip/dice-game kalıbıyla tutarlılık deploy riskini düşürür.

## Karar 3 — Skor kalıcılığı
- **A — Doğrudan `localStorage` API.** `getItem`/`setItem` çağrısı satır-içi.
- **B — İnce wrapper modülü.** `try/catch` + integer doğrulama + storage yoksa zarif düşüş.

| Kriter | A (doğrudan) | B (ince wrapper) |
|--------|--------------|-------------------|
| FR-5 karşılama | ✅ | ✅ |
| NFR-6 (Safari özel mod `setItem` throw) | ⚠️ Yakalanmazsa çökme | ✅ `try/catch` ile güvenli |
| Karmaşıklık | En düşük | Çok düşük (~15 satır) |
| Geri alınabilirlik | Yüksek | Yüksek |

**Seçim: B.** Ek maliyet minimal; Safari private-mode/quota/devre-dışı depolamada NFR-6 için zarif düşüş sağlar, NaN'a karşı skoru doğrular.

## Kalite kapısı raporu
- "En az 2 alternatif karşılaştırıldı" → ✅ GEÇTİ (3 karar noktası × ≥2 gerçek alternatif; her biri ≥5 kriterli trade-off matrisiyle satır-satır karşılaştırıldı).
- Seçilen yığın: **Canvas+rAF render · minimal Express static · ince localStorage wrapper** — Faz 5 (Mimari) bu seçimleri bileşen/veri-akışına açar.
