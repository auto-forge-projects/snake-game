# 07 — Güvenlik Tasarımı: snake-game

- Tarih: 2026-07-19 | Mod: AUTOPILOT | Profil: LITE
- Girdi: `docs/03-requirements.md`, `docs/05-architecture.md`
- Ürün profili: istemci-taraflı, durumsuz (stateless) statik web oyunu. Sunucu = `express.static` + `GET /health`. Kullanıcı girdisi/form/DB/kimlik doğrulama YOK. Saldırı yüzeyi küçük ama sıfır değil (statik servis, bağımlılık zinciri, CI/CD, Docker imajı).

## Varlıklar ve veri sınıflandırma
| Veri | Sınıf | Nerede duruyor | Koruma |
|------|-------|----------------|--------|
| En yüksek skor (`snake.highScore`, integer) | Public / non-PII | Tarayıcı `localStorage` (istemci) | Okumada doğrulanır (parseInt+NaN→0); güven duyulmaz; sunucuya gitmez |
| Oyun durumu (`GameState`: snake/dir/food/score) | Public (geçici) | Yalnız tarayıcı RAM'i | Kalıcı değil; sunucuda karşılığı yok |
| Statik varlıklar (index.html, styles.css, game.js, storage.js) | Public | `public/` (repo + imaj) | Bütünlük: git + imaj digest; salt-okunur servis |
| `/health` yanıtı `{status:"ok"}` | Public | Sunucu (runtime) | Sabit gövde; istek verisi yansıtılmaz |
| Sunucu/uygulama kaynak kodu | Internal | Git reposu (`<owner>/snake-game`) | Repo erişim kontrolü; blind code review (Faz 10) |
| Deploy sırları (`DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`) | Confidential | GitHub Secrets (uygulama dışı) | `env_ref`; log/commit/imaj/istemci bundle'a ASLA girmez |
| **Yok:** PII, kimlik bilgisi, oturum, ödeme, sunucu-tarafı kalıcı veri | — | — | Tasarımca yok (asgari yüzey) |

Veri sınıflandırması eksiksiz: ürün PII/kimlik/sunucu-durumu barındırmaz; tek kalıcı veri parçası hassas olmayan bir tamsayıdır.

## Threat model (STRIDE)
STRIDE, bileşen bazında (S=Spoofing, T=Tampering, R=Repudiation, I=Info Disclosure, D=DoS, E=Elevation):

| Bileşen | Spoofing | Tampering | Repudiation | Info Disclosure | DoS | Elevation | Önlemler |
|---------|----------|-----------|-------------|-----------------|-----|-----------|----------|
| Express static server | N/A (kimlik yok; sunucu kimliği TLS ile) | Path-traversal ile `public/` dışı dosya servisi | N/A (durum-değiştiren eylem yok) | `x-powered-by`, dizin listeleme, dotfile/kaynak sızıntısı, ayrıntılı hata | İstek seli (hafif statik servis) | Rol yok → N/A | SEC-1 (güvenlik başlıkları), SEC-2 (kök kilitli static, dotfiles:ignore, listeleme yok), SEC-7 (hata hijyeni); DoS proxy/altyapı (nginx) |
| Tarayıcı istemci (game.js/storage.js) | N/A (tek yerel oyuncu) | Kullanıcı devtools ile skoru/kodu değiştirir | N/A | Public varlık ötesi veri yok | Bozuk `localStorage` oyunu çökertir | XSS ile script koşumu | SEC-4 (dinamik HTML/eval yok, textContent), SEC-3 (storage sertleştirme), SEC-1 (CSP `default-src 'self'`); skor kurcalama by-design kabul (etki=0, sunucu güvenmez) |
| localStorage | — | Kullanıcı denetiminde, okumada güvenilmez | N/A | Hassas veri yok | Geçersiz değerle çökme | — | SEC-3: okumada parseInt+NaN/negatif→0, aralık sınırlama; yalnız tek anahtar |
| CI/CD (GitHub Actions `deploy-image.yml`) | Sabitlenmemiş 3P action ele geçirilir | Kötücül PR workflow/bağımlılık enjekte eder | — | Sır log'a sızar | — | Aşırı yetkili `GITHUB_TOKEN`/workflow | SEC-8: least-privilege `permissions:`, action'ları SHA'ya pinle, sır maskeleme, `pull_request_target`+untrusted checkout yok |
| Docker imaj / registry | — | Base imaj zehirlenmesi | — | Sır imaja gömülür | — | Container root olarak koşar | SEC-6: base pin, `npm ci` (lockfile), non-root user, `.dockerignore` (.git/node_modules/secrets) |
| nginx + wildcard TLS | Sunucu kimliği sertifika ile | — | — | Şifresiz trafik | Bağlantı seli | — | NFR-4 HTTPS (mevcut altyapı); rate-limit proxy katmanında |

## Auth / Authz stratejisi
**Kimlik doğrulama ve yetkilendirme YOK — ve bu doğru tasarımdır.** Gerekçe: kullanıcı hesabı, oturum, kişiselleştirilmiş/paylaşılan veya sunucu-tarafı korunan kaynak bulunmaz. Oyun tek-oyunculu, tümüyle istemci-taraflı; en yüksek skor tarayıcı-yereldir (kullanıcılar arası paylaşım yok). `/health` bilinçli olarak herkese açıktır (uptime probu, NFR-8). Bir kimlik/yetki katmanı eklemek yalnızca saldırı yüzeyini ve gereksiz sır yönetimini artırırdı (asgari-yüzez ilkesine aykırı). **Not:** Deploy zincirinin kendi kimlik doğrulaması (GitHub Secrets, SSH anahtarı) vardır — bu operasyonel/CI kapsamındadır, ürün çalışma-zamanı değil (bkz. SEC-8).

## OWASP Top 10 değerlendirmesi (kalite kapısı: HER madde)
| # | Risk | Uygulanabilir mi | Önlem / Neden uygulanamaz |
|---|------|------------------|----------------------------|
| A01 | Broken Access Control | Kısmen | Korunan kaynak yok; tek erişim-kontrol yüzeyi statik servistir → path-traversal engeli: `express.static` kök `public/`'e kilitli, `..`/dizin listeleme yok, tek ek route `GET /health` (SEC-2) |
| A02 | Cryptographic Failures | Evet (yalnız transit) | İstemcide/sunucuda hassas veri saklanmaz; en yüksek skor hassas değil → şifreleme gerekmez. Transit için tüm prod trafiği HTTPS (NFR-4, nginx wildcard TLS). Özel/kendi-yapımı kripto YOK |
| A03 | Injection | Evet (düşük) | DB/SQL yok, sunucuya kullanıcı girdisi yok, shell exec yok. İstemcide `eval`/`new Function`/`innerHTML`-untrusted yok; metin `textContent` ile (SEC-4). CSP `default-src 'self'` (SEC-1) |
| A04 | Insecure Design | Evet | Güvenlik-by-design: stateless, sunucu-durumu=0, güvenilmeyen girdi=0, asgari yüzey. Bu doküman = tehdit modelleme kanıtı. `storage.js` fail-safe (NaN→0) tasarımı |
| A05 | Security Misconfiguration | Evet (en alakalı) | Güvenlik başlıkları: CSP, `X-Content-Type-Options:nosniff`, `X-Frame-Options:DENY`/frame-ancestors, `Referrer-Policy:no-referrer`; `x-powered-by` kapalı; dizin listeleme/dotfile servisi yok; ayrıntılı hata çıktısı yok (SEC-1, SEC-2, SEC-7) |
| A06 | Vulnerable and Outdated Components | Evet | Tek prod bağımlılık (express) + transitive. `package-lock.json` pinli; CI `npm audit` Critical/High=0 (NFR-3); `npm ci`; Dependabot/periyodik güncelleme önerilir (SEC-5) |
| A07 | Identification and Authentication Failures | Hayır | Kimlik doğrulama/oturum/parola/kimlik bilgisi tasarımca YOK (bkz. Auth/Authz). Uygulanacak mekanizma olmadığından bu sınıf ürüne uygulanamaz — kanıt: hiçbir kimlik akışı yok |
| A08 | Software and Data Integrity Failures | Evet | Tedarik zinciri: `npm ci`+lockfile integrity hash; GitHub Actions SHA-pin; Docker base imaj pin; güvenilmeyen kaynaktan otomatik güncelleme yok; `.pipeline-complete`'e kadar `[skip ci]` (SEC-5, SEC-6, SEC-8) |
| A09 | Security Logging and Monitoring Failures | Kısmen | Denetlenecek hassas/durum-değiştiren eylem yok. Uptime izleme: `GET /health` (NFR-8). Log'a sır/PII yazılmaz (yazacak veri de yok); minimal erişim log'u yeterli (SEC-7) |
| A10 | Server-Side Request Forgery (SSRF) | Hayır | Sunucu, kullanıcı-kontrollü URL'e giden hiçbir dış istek yapmaz (fetch/proxy/webhook yok). SSRF sink'i mevcut değil → uygulanamaz; regresyonu önlemek için kural: sunucuya dış-çağrı eklenmez |

## AI tedarik zinciri & fabrika tehditleri (Öneri 7 — OWASP'ın körlüğü)
| Tehdit | Uygulanabilir? | Önlem / Neden uygulanamaz |
|--------|----------------|----------------------------|
| Prompt injection (kullanıcı girdisi model davranışını yönlendirir) | Hayır (ürün) | Ürünün çalışma-zamanı LLM'i YOK → runtime prompt-injection yüzeyi yok. Fabrika üretiminde girdi bağlam matrisiyle sınırlı |
| Repository/artefakt prompt poisoning (repoya gömülü talimat ajanı yönlendirir) | Evet (fabrika) | Ajan yalnız beyaz-listeli artefaktları okur (context matrisi); doküman-gömülü talimatlar çalıştırılmaz; Faz 10 blind review (HANDOFF okunmaz) çapa kırar |
| Dependency confusion (iç paket adı public'te ele geçirilir) | Düşük | İç/scoped özel paket yok; yalnız public `express`. Lockfile registry+integrity'yi pinler; iç ada çözülecek isim yok (SEC-5) |
| Malicious package scripts (postinstall vb.) | Evet | Bağımlılık asgari; `package-lock.json` integrity; Docker build'de mümkün olan yerde `npm ci --ignore-scripts`; `npm audit` (SEC-5, SEC-6) |
| Shell komut güvenliği (kullanıcı içeriği kabuğa geçer) | Evet (CI) | Deploy script'i sabit argümanlar kullanır; kullanıcı/istek içeriği shell'e enterpole edilmez; `eval` yok (SEC-8) |
| Workspace sınırı / path & symlink escape | Evet | `express.static` `..` ve kök-dışı yolu engeller; `public/`'te symlink yok; yalnız `public/` servis edilir (SEC-2) |
| Secret leakage (log/çıktı/commit'e sır) | Evet | `env_ref` deseni (düz sır yazılmaz); `.gitignore`/`.dockerignore`; istemci bundle'ında sır yok; CI sır maskeleme (SEC-6, SEC-8) |
| Docker build izolasyonu | Evet | Pinli `node:alpine`; lockfile'dan `npm ci`; non-root user; `.dockerignore` (.git/node_modules/secrets); yalnız public varlık+server.js+prod deps (SEC-6) |
| Üretilen CI güvenliği (tehlikeli pattern, aşırı yetki) | Evet | `permissions:` least-privilege; action'lar SHA-pinli; `pull_request_target`+untrusted checkout yok; `GITHUB_TOKEN` daraltılmış (SEC-8) |
| MCP/tool izinleri (ajan araç yüzeyi) | Evet (fabrika) | Faz 7 execution policy = WORKSPACE_WRITE (test/ağ/konteyner yok); faz-başına en-az-yetki. Ürünün MCP'si yok |

## Faz 9'a güvenlik gereksinimleri
Developer bu listeyi implementasyon kontrol listesi olarak kullanır (kabul kriteri: her madde kod + Faz 10 review'da doğrulanabilir):
- [ ] **SEC-1: Güvenlik başlıkları.** `server.js` her yanıta ekler: `Content-Security-Policy: default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`. `app.disable('x-powered-by')`. (A03/A05, S/I)
- [ ] **SEC-2: Kilitli statik servis.** `express.static` YALNIZ `public/` kökünü servis eder; `dotfiles:'ignore'`, dizin listeleme kapalı, kök-dışı/`..` yol reddedilir. Tek ek route `GET /health` → sabit `200 {status:"ok"}` (istek gövdesi/başlığı yansıtılmaz). Başka route yok. (A01, T/I)
- [ ] **SEC-3: localStorage sertleştirme.** `storage.js` okumada `try/catch` + `parseInt(v,10)`; `NaN`/negatif/`!isFinite` → `0`; `Number.MAX_SAFE_INTEGER` sınırla. Yalnız doğrulanmış tamsayıyı `snake.highScore` anahtarına yaz. Depolama hatasında (Safari özel-mod) zarif `0` düşüşü. `JSON.parse`/`eval` ile yürütülebilir bağlama alma YOK. (A04, T/D)
- [ ] **SEC-4: DOM injection'sız istemci.** Untrusted/dinamik veri asla `innerHTML`/`outerHTML`/`document.write`'a atanmaz; skor ve "Oyun Bitti" metni yalnız `textContent`/`setAttribute('aria-live',…)` ile. `eval`/`new Function`/string-`setTimeout` yok. (A03, E)
- [ ] **SEC-5: Bağımlılık hijyeni.** `package-lock.json` commit'lenir; prod bağımlılık asgari (yalnız express); CI `npm audit --audit-level=high` çalıştırır ve Critical/High'da fail eder (NFR-3); kurulum `npm ci` (asla `npm install`). (A06/A08)
- [ ] **SEC-6: Dockerfile sertleştirme.** Base imaj pinli (`node:<sürüm>-alpine`); container non-root user olarak koşar; `.dockerignore` `.git`,`node_modules`,`*.env`,sırları hariç tutar; imaja sır/build-arg gömülmez; final imaj yalnız public varlıklar + server.js + prod deps. (A08, imaj tampering)
- [ ] **SEC-7: Hata/yanıt hijyeni.** Sunucu stack-trace/iç yol sızdırmaz; bilinmeyen route → jenerik 404 (yansıtılmış istek verisi yok); catch-all minimal gövde. Log'a sır/PII yazma (yazacak veri yok ama kural sabitlenir). (A05/A09, I)
- [ ] **SEC-8: CI/CD least-privilege (Faz 12'ye köprü, Faz 9 lockfile/dockerignore hazırlığıyla başlar).** `deploy-image.yml` `permissions:` minimuma daraltılır; 3P action'lar commit-SHA'ya pinlenir; sırlar GitHub Secrets/`env_ref` ile (düz yazım yok, maskelenmiş); `pull_request_target`+untrusted checkout kullanılmaz. (A08, CI güvenliği)

## Risk kabulleri (transparanlık)
- **İstemci-taraflı skor kurcalama (by-design, non-critical):** Kullanıcı devtools/localStorage ile kendi en yüksek skorunu değiştirebilir. **Etki = 0:** sunucu-tarafı skor tablosu/güven yok, kullanıcılar-arası veya bütünlük etkisi yok, PII yok. Bu, tek-oyunculu istemci oyununun doğal özelliğidir; azaltma (sunucu doğrulaması) asgari-yüzey tasarımını bozardı. **Kritik olmadığından insan onayı gerekmez** (bkz. DL-07-001).
- **Uygulama-içi rate-limit yok (DoS proxy'ye devir):** App-katmanı DoS koruması nginx/altyapıya devredilir; statik servis hafiftir. Non-critical residual.

## Kalite kapısı raporu
- "OWASP Top 10 değerlendirildi" → ✅ — A01..A10'un HER biri tabloda uygulanabilirlik + önlem/gerekçeyle değerlendirildi (A07 ve A10 gerekçeli "uygulanamaz").
- "AI/tedarik zinciri tehditleri değerlendirildi" → ✅ — 10 satırın tamamı (prompt injection … MCP/tool izinleri) uygulanabilirlik + önlemle dolduruldu.
- "STRIDE tehdit modeli" → ✅ — 6 bileşen × 6 STRIDE kategorisi değerlendirildi.
- "Hassas veri sınıflandırması eksiksiz" → ✅ — tüm veri kalemleri sınıflandırıldı; PII/sunucu-durumu tasarımca yok olarak kanıtlandı.
- "Faz 9'a SEC gereksinimi devredildi" → ✅ — SEC-1..SEC-8 (8 somut madde) implementasyon listesi olarak devredildi.
