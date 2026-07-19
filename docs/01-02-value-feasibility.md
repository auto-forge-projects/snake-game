# 01-02 — Değer & Fizibilite (LITE birleşik faz): snake-game

> LITE profil: yarım sayfa hedefi, paydaş analizi yok.

- Tarih: 2026-07-19 | Mod: AUTOPILOT | Profil: LITE

## Değer önerisi
Ziyaretçiye kurulum/hesap gerektirmeyen, tarayıcıda anında açılıp klavyeyle oynanabilen klasik bir Snake oyunu kazandırır — solo geliştiricinin portföyüne coinflip/dice-game ile aynı ölçekte, düşük maliyetle bir demo/oyun daha ekler.

## KPI'lar (kalite kapısı: en az 3, ölçülebilir)
1. Giriş gecikmesi: ok tuşuna basıştan yönün ekranda değişmesine kadar ≤ 100ms (idea Başarı Kriteri 3 ile birebir).
2. Kare hızı: oyun döngüsü 60 FPS civarında (≥55 FPS ortalama) çalışır, gözle görülür takılma olmaz.
3. Skor kalıcılığı: sayfa yenilendikten/tarayıcı kapatılıp açıldıktan sonra en yüksek skor `localStorage`'dan doğru okunur (idea Başarı Kriteri 2 ile birebir).
4. Yükleme boyutu: ana sayfa ilk yüklemesi (HTML+CSS+JS toplam) ≤ 150 KB (statik/stateless hedefiyle tutarlı hafiflik ölçütü).

## Fizibilite
- Teknik: Saf HTML5 Canvas + vanilla JS oyun döngüsü (`requestAnimationFrame`) — coinflip/dice-game'de kanıtlanmış statik servis kalıbına ek olarak yalnız istemci-taraflı oyun mantığı; sunucu tarafında durum/DB yok. ✅
- Ekonomik: Altyapı maliyeti 0 (statik dosyalar + hafif Express sunucusu, dış servis/DB yok); geliştirme tahmini ~1 gün (dice-game'e benzer küçük kapsam). ✅
- Zaman: v1 tek milestone'da (≤ 2-3 gün) teslim edilebilir; mevcut SSH-push deploy akışı ve Docker paketleme doğrudan uyarlanabilir, yeni altyapı kurulumu gerekmez. ✅

## GO / NO-GO önerisi: **GO**
Gerekçe: Teknik/ekonomik/zaman fizibilitesinin üçü de pozitif; kapsam mevcut coinflip/dice-game emsalleriyle örtüştüğü için mimari/deploy riski asgari düzeyde. KPI'lar ölçülebilir ve büyük çoğunluğu Faz 9/11'de otomatik test ile doğrulanabilir niteliktedir. Kalan iki açık soru (mobil dokunmatik kontrol, görsel stil — bkz. `docs/00-idea.md`) ürünün temel değer önerisini veya fizibilitesini değiştirmiyor; bunlar Faz 3 (Requirement) ve Faz 6 (UI/UX)'da netleştirilecek. Geri dönüş maliyeti düşük (henüz kod yazılmadı), bu nedenle daha fazla netleştirme beklemeden GO ile ilerlemek LITE bütçesine uygundur.

## Kalite kapısı raporu
- "En az 3 ölçülebilir KPI" → ✅ GEÇTİ (4 KPI tanımlandı, her biri hedef değer + ölçüm yöntemiyle; KPI 1-3 idea'daki başarı kriterleriyle birebir izlenebilir).
- "GO/NO-GO kararı gerekçeli" → ✅ GEÇTİ (GO; üç fizibilite ekseni pozitif, gerekçe ve açık soruların sonraki fazlara devri yukarıda açıkça yazılı).

## Açık sorular (idea'dan devralındı, bu fazda kapatılmadı)
- Mobil dokunmatik kontrol v1'de gerekli mi? → Faz 3 (Requirement)'te netleştirilecek.
- Görsel stil tercihi (minimal/retro piksel) var mı? → Faz 6 (UI/UX)'da netleştirilecek.

Bu iki soru GO/NO-GO kararını veya KPI'ları etkilemiyor (mevcut varsayımlar — yalnız klavye, sabit ızgara — altında da fizibilite pozitif); bu nedenle fazın kapanması için beklenmelerine gerek görülmedi.
