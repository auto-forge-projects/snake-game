# 03 — Requirement Analizi: snake-game

- Tarih: 2026-07-19 | Mod: AUTOPILOT | Profil: LITE

## Bu fazda kapatılan açık sorular (bkz. `docs/00-idea.md` ve `docs/01-02-value-feasibility.md`)

İdea'dan devralınan 2 açık soru, aşağıdaki FR'lerin içine **varsayım olarak** kapatılmıştır (gerekçe için bkz. `decisions/DL-03-001.md`):

1. **Mobil dokunmatik kontrol gerekli mi?** → Hayır, v1 yalnız klavye (FR-2, FR-7). İdea'daki "kapsam dışı" maddesiyle zaten tutarlı.
2. **Görsel stil tercihi?** → Minimal düz-renk ızgara (retro piksel doku/sprite yok) — Faz 6 (UI/UX) bu varsayımı detaylandırır; ürün kararı niteliğinde olduğundan orada gözden geçirilebilir.

## Fonksiyonel gereksinimler

### FR-1: Oyunu Başlatma
- **User story:** Oyuncu olarak, sayfayı açtığımda oyunu tek bir eylemle başlatmak istiyorum, böylece hemen oynamaya başlayabileyim.
- **Kabul kriterleri:**
  - Given sayfa yüklenir, when kullanıcı "Başlat" butonuna tıklar veya herhangi bir ok tuşuna basar, then yılan sabit bir başlangıç konumunda/yönde ekranda görünür ve oyun döngüsü başlar.
  - Given oyun başlamadan önce, when sayfa ilk açılır, then ızgara ve yılan görünür ama hareket etmez (kullanıcı eylemi bekler).
- **Öncelik:** Must

### FR-2: Klavye ile Yön Kontrolü
- **User story:** Oyuncu olarak, yılanı ok tuşlarıyla 4 yönde yönlendirmek istiyorum, böylece yemleri toplayıp engellerden kaçınabileyim.
- **Kabul kriterleri:**
  - Given oyun çalışıyor, when kullanıcı ↑↓←→ tuşlarından birine basar, then yılan bir sonraki adımda o yöne döner (giriş → yön değişimi gecikmesi ≤ 100ms).
  - Given yılan şu an sağa hareket ediyor, when kullanıcı sola (180°) tuşuna basar, then yön değişikliği YOK SAYILIR (yılan kendi üzerine anında çarpışmaz).
  - Given oyun, when yalnızca klavye kullanılır, then tüm oyun akışı (başlat/oyna/yeniden başlat) fare/dokunmatik olmadan tamamlanabilir.
- **Öncelik:** Must

### FR-3: Yem Yeme, Büyüme ve Skor Artışı
- **User story:** Oyuncu olarak, yem yediğimde yılanın uzadığını ve skorumun arttığını görmek istiyorum, böylece ilerlememi takip edebileyim.
- **Kabul kriterleri:**
  - Given yılanın başı yem hücresine girer, when çarpışma tespit edilir, then yılan bir birim uzar ve skor 1 artar; yeni yem ızgara üzerinde yılanın gövdesi DIŞINDA rastgele bir hücrede belirir.
  - Given güncel skor, when herhangi bir yem yenir, then skor ekranda anında güncellenir.
- **Öncelik:** Must

### FR-4: Çarpışma Tespiti ve Oyun Sonu
- **User story:** Oyuncu olarak, duvara veya kendime çarptığımda oyunun net şekilde bittiğini görmek istiyorum, böylece sonucu anlayabileyim.
- **Kabul kriterleri:**
  - Given yılan hareket ediyor, when başı ızgara sınırının dışına çıkar VEYA kendi gövdesiyle aynı hücreye girer, then oyun döngüsü durur ve "Oyun Bitti" mesajı + final skor gösterilir.
  - Given oyun bitti durumu, when ekran okuyucu kullanılır, then "Oyun Bitti" ve final skor `aria-live` bölgesiyle duyurulur.
- **Öncelik:** Must

### FR-5: Skor Kalıcılığı (En Yüksek Skor)
- **User story:** Oyuncu olarak, en yüksek skorumun tarayıcıyı kapatıp açsam bile kalmasını istiyorum, böylece kendimi geliştirdiğimi görebileyim.
- **Kabul kriterleri:**
  - Given oyun biter, when final skor önceki en yüksek skordan büyükse, then yeni en yüksek skor `localStorage`'a yazılır.
  - Given sayfa yeniden yüklenir (tarayıcı kapatılıp açılsa bile), when ana ekran gösterilir, then `localStorage`'dan okunan en yüksek skor ekranda görünür.
- **Öncelik:** Must

### FR-6: Yeniden Başlatma
- **User story:** Oyuncu olarak, oyun bittikten sonra sayfayı yenilemeden tekrar oynamak istiyorum, böylece kesintisiz deneyim yaşayayım.
- **Kabul kriterleri:**
  - Given "Oyun Bitti" ekranı, when kullanıcı "Tekrar Oyna" tuşuna basar/tıklar, then yılan başlangıç durumuna sıfırlanır, skor 0'a döner ve oyun yeniden başlar (en yüksek skor korunur).
- **Öncelik:** Must

### FR-7: Kapsam Sınırı
- **User story:** Oyuncu olarak, basit ve odaklı bir Snake deneyimi istiyorum, böylece dikkatim dağılmasın.
- **Kabul kriterleri:**
  - Given arayüz, when incelenir, then çok oyunculu/online skor tablosu, zorluk seviyesi seçimi veya farklı harita temaları YER ALMAZ.
  - Given kontrol şeması, when incelenir, then dokunmatik/swipe kontrolü YER ALMAZ (yalnız klavye — bkz. Açık soru 1).
- **Öncelik:** Must

## Fonksiyonel olmayan gereksinimler (kalite kapısı: ölçülebilir)

| ID | Kategori | Gereksinim | Ölçüt / Hedef |
|----|----------|------------|----------------|
| NFR-1 | Performans | Klavye girişinden yön değişimine kadar gecikme düşük olmalı | ≤ 100ms |
| NFR-2 | Performans | Oyun döngüsü akıcı çalışmalı | ~60 FPS hedef, ≥ 55 FPS ortalama, gözle görülür takılma yok |
| NFR-3 | Güvenlik | Sunucu kalıcı oyun verisi tutmamalı, saldırı yüzeyi asgari olmalı | Sunucu tarafı DB/dosya yazımı = 0 (statik GET + health); `npm audit` Critical/High = 0 |
| NFR-4 | Güvenlik | Trafik şifreli taşınmalı | Prod ortamda tüm trafik HTTPS (mevcut wildcard TLS deploy altyapısı) |
| NFR-5 | Erişilebilirlik | Oyun tamamen klavyeyle kullanılabilir, ekran okuyucu uyumlu olmalı | %100 klavye erişilebilirliği; skor/oyun-sonu `aria-live` ile duyurulur; kontrast oranı ≥ 4,5:1 (WCAG 2.1 AA) |
| NFR-6 | Uyumluluk | Güncel masaüstü tarayıcılarda çalışmalı | Chrome/Firefox/Safari/Edge'in son 2 major sürümünde hatasız çalışır |
| NFR-7 | Dağıtılabilirlik | Docker imajı hafif ve hızlı üretilebilir olmalı | İmaj boyutu ≤ 150 MB; `docker build`→çalışan `docker run` süresi ≤ 15 dk |
| NFR-8 | Güvenilirlik | Health check her zaman doğru durum bildirmeli | `GET /health` başarı oranı = %100 (200 OK) |

## İzlenebilirlik

| FR | Karşıladığı KPI / iş hedefi |
|----|------------------------------|
| FR-1 (Başlatma) | idea Başarı Kriteri 1 |
| FR-2 (Klavye kontrolü) | KPI-1 (giriş gecikmesi ≤100ms) · idea Başarı Kriteri 1 |
| FR-3 (Yem/büyüme/skor) | idea Başarı Kriteri 2 |
| FR-4 (Çarpışma/oyun sonu) | idea Başarı Kriteri 1 |
| FR-5 (Skor kalıcılığı) | KPI-3 (localStorage kalıcılık) · idea Başarı Kriteri 2 |
| FR-6 (Yeniden başlatma) | Değer önerisi (kesintisiz deneyim) |
| FR-7 (Kapsam sınırı) | idea "Kapsam dışı (v1)" |

## Kalite kapısı raporu
- "Her FR'nin kabul kriteri var" → ✅ GEÇTİ — FR-1..FR-7'nin her biri en az 2 Given/When/Then kabul kriteri içeriyor.
- "NFR'ler ölçülebilir" → ✅ GEÇTİ — NFR-1..NFR-8'in her biri somut bir sayı/eşik içeriyor (≤100ms, ~60FPS, ≥4,5:1 kontrast, ≤150MB, ≤15dk, %100 health).
