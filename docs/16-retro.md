# 16 — Retrospektif: AutoForge pipeline'ı (snake-game koşusu)

- Tarih: 2026-07-19 | Mod: AUTOPILOT | Girdi: `AUTOFORGE-FEEDBACK.md` (AF-036, AF-039, AF-044, AF-046, AF-047)
- Kapsam: FABRİKA değerlendirilir, ürün değil.

## Ne iyi gitti
- LITE profil + hibrit devir politikası hızlı çalıştı: 17 faz ~7 saat (kesintiler dahil) içinde tamamlandı, yalnız Faz 4/5/7/10 gerçek subagent devri (Opus), geri kalanı orchestrator inline.
- Author≠Reviewer korundu: Faz 9 Sonnet yazdı, Faz 10 Opus (blind, async — LITE FAST) bağımsız denetledi; Blocker/Critical=0.
- TDD commit disiplini (`test(red)`→`feat(green)` çiftleri, TASK-NNN etiketli) AF-044'ün kod-enforced iş listesi backfill'i ile tam uyumlu çalıştı — `git log` doğrulanabilir iz bıraktı.
- Kalite kapıları (structural/mechanical/all) hiçbir fazda beyan yetmezliği yaşamadan geçti; Faz 9/12 mechanical kapı gerçek `npm test`/Docker build koşusuna dayandı.

## En önemli öğrenim
AF-044/AF-046 fix'leri (post-commit hook auto-push, headless permission bypass + env-scrub) TEK BAŞINA yeterli değil: bu koşuda Faz 12'nin kapanışı yine de commit atılmadan (yalnız staged) yarıda kesildi bulundu (bkz. AF-047). Kod-enforced backstop'lar güvenilirliği artırıyor ama sıfırlamıyor — doctor'ın bulgu setinde hâlâ kör bir nokta var: "gate geçti + state günceli ama git working tree kirli/commit atılmamış" ayrı bir kategori olarak yakalanmıyor.

## Kök-neden temaları (AF kayıtları → temalar)
| Tema | İlgili AF | Özet |
|------|-----------|------|
| Convention→kod-enforced geçişi hâlâ tam kapanmadı | AF-044, AF-047 | İş listesi+push güncellemesi ajan disiplininden koda taşındı (post-commit hook) ama doctor'ın kendisi "commit hiç atılmadı" durumunu ayrı bulgu olarak modellemiyor — bu koşuda elle teşhis+catch-up gerekti. |
| Headless özerklik köşe durumları | AF-046 | Env-scrub + `--dangerously-skip-permissions` dashboard restart'ı gerektiriyordu; restart-öncesi/geçiş anındaki koşumlar eski davranışta kalabiliyor. |
| Paralel-eligible fazlar sıralı koşuyor | profiles.json `parallel_sets` | Faz 13/14 (deps: yalnız 12) paralel başlayabilirdi ama orchestrator inline yazdığından sıralı işlendi — kazanç yalnız gerçek subagent devrinde somutlaşıyor. |

## Somut süreç iyileştirmeleri (kalite kapısı: ≥1)
### Öneri 1 — `doctor.mjs`'e `UNCOMMITTED_WORK` bulgu türü ekle **[P2, seçildi]**
Faz `done`+`gate_passed:true` ama `git status --porcelain` boş değilse (staged/unstaged fark var, hiç commit atılmamış) yeni bir bulgu türü üret: "artefaktlar hazır, yalnız commit+push eksik". Bu, mevcut `GATE_MISMATCH`/`UNPUSHED_WORK` ikilisinin arasındaki boşluğu kapatır (bkz. AF-047, bu koşuda elle teşhis edildi). Uygulama: `scripts/doctor.mjs`'e projeler için `git status --porcelain` kontrolü + yeni bulgu tipi.

## MASTER-PROMPT / CLAUDE.md / şablon değişiklik önerileri
1. `scripts/doctor.mjs` → `UNCOMMITTED_WORK` bulgu türü (yukarıdaki Öneri 1).
2. CLAUDE.md kural 1 (doctor bulgu listesi) → yeni bulgu tipi eklenince fix talimatı da dokümante edilmeli.

## Kalite kapısı raporu
- "En az 1 somut süreç iyileştirmesi" → ✅ (Öneri 1: `UNCOMMITTED_WORK` doctor bulgu türü, AF-047'ye bağlı)
