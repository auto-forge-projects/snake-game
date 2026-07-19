# 00 — Rafine Proje Brief'i: snake-game

> **Faz 0b çıktısı.** Ham fikir, kullanılabilen en iyi modelle yapılandırılmış brief'e dönüştürülür.
> Bu brief kullanıcıya HAM FİKİRLE YAN YANA sunulur; **onaylanmadan Faz 0 (00-idea.md) üretilmez.**
> Onay sonrası bu brief, Faz 0 ve sonraki tüm fazların girdisidir.

- Tarih: 2026-07-19 | Rafine eden model: sonnet (hızlı) | Onay durumu: **Onaylandı** (dashboard, 2026-07-19)

## Ham fikir (kullanıcının girdisi — değiştirilmez)
> bir yılan oyunu yap

## Rafine problem (tek cümle)
Kullanıcının tarayıcıda tek başına, klavye ile oynayabileceği klasik bir yılan (Snake) oyunu yok.

## Hedef kitle
Tek oyunculu, kısa mola/eğlence arayan herhangi bir kullanıcı; masaüstü tarayıcıda klavye ile oynar.

## Kısıtlar & varsayımlar (AF-001 kapanışı)
- Platform/runtime: Web (tarayıcı), istemci-taraflı; sunucu/backend gerekmez (statik site).
- Çevrimiçi/çevrimdışı, veri konumu: Tamamen çevrimdışı çalışabilir; skor yalnız `localStorage`'da (en yüksek skor).
- Zaman/kota bütçesi: LITE profil, küçük artefakt bütçesi.
- Varsayımlar: Tek oyunculu (çok oyunculu/online skor tablosu yok), klavye ok tuşları kontrol, sabit ızgara boyutu, mobil dokunmatik kontrol v1 kapsamı dışı.

## Başarı kriterleri (ölçülebilir)
1. Yılan ok tuşlarıyla 4 yönde kontrol edilebiliyor, kendine veya duvara çarpınca oyun bitiyor.
2. Yem yenince yılan uzuyor ve skor artıyor; en yüksek skor `localStorage`'da kalıcı.
3. Oyun 60 FPS civarı akıcı çalışıyor, giriş gecikmesi göze çarpmıyor.

## Kapsam sınırı (v1'de yapılmayacaklar)
- Çok oyunculu / online skor tablosu yok.
- Mobil dokunmatik/swipe kontrol yok (v1: yalnız klavye).
- Zorluk seviyeleri / farklı harita temaları yok.

## Açık sorular (kullanıcının netleştirmesi önerilen)
- [ ] Mobil dokunmatik kontrol v1'de gerekli mi, yoksa v2'ye mi bırakılsın?
- [ ] Görsel stil tercihi var mı (minimal/retro piksel vb.) yoksa serbest mi bırakılsın?

## Önerilen profil ve ilk mod
- Profil: LITE · Gerekçe: Küçük, tek özellikli, solo/kişisel bir oyuncak proje — kurumsal süreçlere gerek yok.

---
## Onay kaydı
- 2026-07-19 — Beklemede
