# snake-game v0.1.0 — Release Notes

- Tarih: 2026-07-19 | SemVer: **v0.1.0** (0.x = API garanti yok) | Mod: AUTOPILOT
> Sürüm numarası Faz 8 planındaki M1 milestone'ı ile tutarlı (v0.1.0 = "Oynanabilir v1").

## Öne çıkanlar
- Klavye kontrollü, tarayıcı-içi Snake oyunu; tek ekran, bağımlılıksız istemci.
- localStorage ile kalıcı yüksek skor.
- Docker imajı ile paketlenmiş, sıfır-bağımlılık sunucu (`node:22-alpine`, non-root).

## Özellikler
- FR-1..7: yön kontrolü (ok tuşları, 180° engeli), yem üretimi/büyüme/skor, duvar+kendine çarpışma ile oyun sonu, yeniden başlatma, localStorage highscore.
- NFR-1/2: fixed-step (≤100ms) oyun mantığı + `requestAnimationFrame` render ayrımı — girdi gecikmesi ve FPS hedefleri mimari ile karşılanıyor (bkz. `docs/05-architecture.md`).
- NFR-5/8: aria-live skor/oyun-sonu duyuruları (erişilebilirlik).

## Güvenlik
- SEC-1..8 (bkz. `docs/07-security.md`, Faz 9 TASK-008): güvenlik başlıkları, kilitli `express.static`, storage sertleştirme (parseInt+NaN/negatif/max-safe koruma), injection-free DOM, `npm audit` temiz (0 critical/high), Dockerfile non-root, CI least-privilege.
- Blocker/Critical: 0 (Faz 7 ve Faz 10, bkz. DL-07-001, DL-10-001).

## Bilinen sınırlar (docs/15-maintenance.md referanslı)
- Docker imajı 241MB, NFR-7 (≤150MB) bütçesini aşıyor — Faz 15 teknik borcu.
- Faz 10 review'da 1 Major (flaky test, F1) — LITE eşiği ({critical,1}) zorlamıyor, Faz 15 borcuna not düşüldü.
- Playwright/gerçek-tarayıcı E2E ve NFR-2 (FPS) ölçümü bilinçli kapsam dışı (DL-11-001).

## Kurulum
```bash
docker build -t snake-game:0.1.0 .
docker run -p 3000:3000 snake-game:0.1.0
# http://localhost:3000 — health: /health
```

## Rollback planı (kalite kapısı)
1. Kod: `git revert` veya önceki tag'e (`v0.1.0` öncesi commit) `git checkout` — tek milestone (M1), önceki kararlı tag yok; ilk sürüm olduğundan rollback = imajı durdurup önceki (yok) imaja dönmek yerine servisi durdurmak.
2. Veri uyumluluğu: Sunucu tarafında veri yok (stateless); istemci `localStorage` highscore'u rollback'ten etkilenmez, downgrade veri kaybı yaratmaz.
3. Doğrulama: Rollback sonrası `/health` 200 dönüyor mu + statik varlıklar (index.html/game.js) 200 ile servis ediliyor mu kontrol edilir.
4. Dağıtım: `deploy.json.enabled:false` (opt-in kapalı) — bu sürümde otomatik dağıtım yok; ileride etkinleştirilirse önceki imaj tag'i (`snake-game:<prev-sha>`) ile `docker run` yeniden başlatılır.

## Kalite kapısı raporu
- "Rollback prosedürü tanımlı" → ✅
- "Sürüm plana uygun" → ✅ (Faz 8 milestone: v0.1.0, M1 "Oynanabilir v1")
