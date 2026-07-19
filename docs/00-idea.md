# 00 — Fikir (Intake): snake-game

- Tarih: 2026-07-19 | Mod: AUTOPILOT | Profil: LITE

## Problem (tek cümle)
Kullanıcının tarayıcıda tek başına, klavye ile oynayabileceği klasik bir yılan (Snake) oyunu yok.

## Çözüm fikri
Tarayıcıda çalışan, istemci-taraflı (sunucu/backend gerekmeyen), ok tuşlarıyla kontrol edilen klasik Snake oyunu: yılan yem yedikçe uzar, kendine/duvara çarpınca oyun biter, en yüksek skor `localStorage`'da kalıcı tutulur.

## Hedef kitle
Tek oyunculu, kısa mola/eğlence arayan herhangi bir kullanıcı; masaüstü tarayıcıda klavye ile oynar.

## Kısıtlar & varsayımlar (rafine brief'ten aktarıldı)
- Platform/runtime: Web (tarayıcı), istemci-taraflı; sunucu/backend gerekmez (statik site).
- Çevrimiçi/çevrimdışı: Tamamen çevrimdışı çalışabilir; skor yalnız `localStorage`'da.
- Zaman/kota bütçesi: LITE profil, küçük artefakt bütçesi.
- Varsayımlar: Tek oyunculu (online skor tablosu yok), yalnız klavye ok tuşları, sabit ızgara boyutu, mobil dokunmatik kontrol v1 kapsamı dışı.

## Başarı kriterleri
1. Yılan ok tuşlarıyla 4 yönde kontrol edilebiliyor, kendine veya duvara çarpınca oyun bitiyor.
2. Yem yenince yılan uzuyor ve skor artıyor; en yüksek skor `localStorage`'da kalıcı.
3. Oyun 60 FPS civarı akıcı çalışıyor, giriş gecikmesi göze çarpmıyor.

## Kapsam dışı (v1)
- Çok oyunculu / online skor tablosu yok.
- Mobil dokunmatik/swipe kontrol yok (v1: yalnız klavye).
- Zorluk seviyeleri / farklı harita temaları yok.

## Açık sorular (rafine brief'ten devralındı, henüz netleşmedi)
- Mobil dokunmatik kontrol v1'de gerekli mi, yoksa v2'ye mi bırakılsın?
- Görsel stil tercihi var mı (minimal/retro piksel vb.) yoksa serbest mi bırakılsın?

## Önerilen profil
- **LITE** — Solo, küçük kapsamlı, tek sayfalık statik/stateless bir oyun. Faz 1+2 birleşik ilerler (`docs/01-02-value-feasibility.md`).

## Kalite kapısı raporu
- "Problem tek cümlede ifade edilebiliyor" → ✅ GEÇTİ (yukarıdaki "Problem (tek cümle)" bölümü, rafine brief'in "Rafine problem" bölümünden birebir aktarılmıştır; tek cümle, çelişkisiz).
