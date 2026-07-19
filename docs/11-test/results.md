# 11 — Test Sonuçları: snake-game

- Tarih: 2026-07-19 | Çalıştırma: `npm run test:coverage` (node:test yerleşik runner)

## Geçen/kalan

| Metrik | Değer |
|--------|-------|
| Toplam test | **44** (39 birim + 5 entegrasyon) |
| Geçti | 44 |
| Kaldı | 0 |
| Satır coverage | %99.14 (dal %95.83, fonksiyon %96.15) |

## Coverage (`node --test --experimental-test-coverage`)

| Dosya | Line % | Branch % | Func % | Kapsanmayan satır |
|-------|--------|----------|--------|---------------------|
| public/game.js | 100.00 | 100.00 | 100.00 | — |
| public/storage.js | 100.00 | 86.67 | 100.00 | — |
| src/server.js | 94.55 | 83.33 | 80.00 | 51-53 |
| **Tümü** | **99.14** | **95.83** | **96.15** | |

**src/server.js:51-53 açıklaması:** `if (require.main === module) { app.listen(...) }` bloğu — yalnız dosya doğrudan çalıştırıldığında (prod/`npm start`) tetiklenir, test altında `require` ile yüklendiğinden çalışmaz. Kabul edilen, kaçınılmaz bir kapsam boşluğu (bkz. DL-11-001) — kritik iş mantığı taşımaz, yalnız port bağlama.

## Başarısızlık analizi
Yok — 44/44 test ilk çalıştırmada yeşil geçti, geri besleme gerekmedi.

## Kalite kapısı raporu
- "Kritik senaryolar %100" → ✅ GEÇTİ (S1..S12, `test-plan.md`).
