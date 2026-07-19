# 14 — Monitoring: snake-game

- Tarih: 2026-07-19 | Mod: AUTOPILOT | Profil: LITE → basit health check + hata loglama

## Ürün tipine göre izleme (`state.product.type`: web/Frontend + ince statik sunucu)
| Tip | İzlenecekler |
|-----|--------------|
| Frontend (istemci) | JS hataları (konsol), `localStorage` erişim hataları (storage.js try/catch zaten yutuyor — DL-09-001) |
| API (statik sunucu, `src/server.js`) | `/health` endpoint durumu, 404/500 oranı, process crash |

> LITE profilde asgari: health endpoint + sunucu tarafı hata logu yeterli; ayrı APM/metrik altyapısı bu ölçekte gereksiz (NFR bütçesi yok).

## Health check
| Kontrol | Sağlıklı | Sorunlu davranış |
|---------|----------|-------------------|
| `GET /health` | `200 {"status":"ok"}` | Timeout / non-200 → container/process down, `docker run` yeniden başlatılmalı |
| Statik varlık servisi | `GET /` → `200` (index.html) | `404`/`500` → `public/` yanlış mount edilmiş veya build eksik |
| Container process | `docker ps` çalışıyor | Container `Exited` → `docker logs snake-game` ile stdout/stderr incelenir |

## Hata görünürlüğü / loglama
- Sunucu tarafı: Express hata middleware'i (`src/server.js` son blok) 500'de istemciye jenerik mesaj döner, gerçek hata `console.error` ile stdout'a yazılır (Docker/`docker logs` üzerinden görünür) — stack trace istemciye SIZMAZ (SEC-7).
- İstemci tarafı: `storage.js` localStorage erişim hataları (quota/erişim engeli) try/catch ile yutulur, oyun akışını bozmaz; kullanıcıya görünür hata YOK (bilinçli tasarım — bkz. DL-09-001), konsola `console.warn` düşer (geliştirici görünürlüğü).
- Hassas veri loglanmaz: Kullanıcı girdisi yok (yalnız klavye ok tuşları + localStorage skor sayısı); loglarda PII/sır bulunmaz.

## Kritik akış izleme (kalite kapısı)
- **En kritik risk: sunucu ayakta değil → oyun tamamen erişilemez.** Görünürlük: `/health` endpoint'i + deploy sonrası (deploy.json.enabled:true olduğunda) `remote-deploy.sh` script'inin health-check adımı (bkz. deploy.json `healthcheck: "/health"`). Bu sürümde (`enabled:false`) otomatik deploy/alert altyapısı YOK — kullanıcı elle `docker ps`/`docker logs` ile izler; deploy açıldığında canlı `/health` probe (kural 9) otomatik eklenir.
- İkincil risk: statik varlık 404 (yanlış path/build) → `/`  health check'i bunu da yakalar (index.html servis edilemezse health check zaten sunucunun ayakta olduğunu ama içeriğin bozuk olduğunu ayırt etmez — bilinen sınır, Faz 15 borcuna not düşülebilir).

## Kalite kapısı raporu
- "Kritik akışlar için alert/hata görünürlüğü tanımlı" → ✅ (health check + sunucu-taraflı hata logu; LITE ölçeğinde yeterli, ayrı alert altyapısı kapsam dışı — deploy.json.enabled:false)
