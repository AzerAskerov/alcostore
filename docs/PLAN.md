# Alco Store — texniki plan və ilkin araşdırma

> Tarix: 2026-09-28 · Status: **qaralama, təsdiq gözləyir**
> Mənbələr: `AlcoStore_design.html` (dizayn), `OwnProjects/TurMat` (istinad arxitektura), Apple App Review Guidelines, Google Play Developer Policy.

---

## 0. Qısa xülasə (TL;DR)

- **Nə quracağıq:** 1 mobil tətbiq (iOS + Android, Expo), 1 veb sayt (Next.js), 1 admin panel (vebdə `/admin`, Telegram ilə giriş), 1 API (Cloudflare Workers + D1 + R2). Hamısı TurMat-dakı kimi **bir monorepoda**.
- **Sifariş modeli (dizayna görə):** tətbiq/sayt ödəniş qəbul etmir. Səbət hazır mətnə çevrilir və **WhatsApp-a** göndərilir. Bu, store review-u çox asanlaşdırır: ödəniş, IAP, kart məlumatı, KYC yoxdur.
- **Mock data:** kataloqu tətbiqin içinə yazmırıq. Onu **API-nin bazasına seed** kimi qoyuruq. Sonra real məhsullar admin paneldən daxil ediləndə **yeni store review lazım olmayacaq**. Tətbiq datanı serverdən çəkir.
- **Store-lar:** hər iki store alkoqol mağazası tətbiqinə icazə verir. Şərtlər: 18+ reytinq, yaş təsdiqi (age gate), həddindən artıq içkini təşviq etməmək. Ən böyük risklər aşağıdakılardır (bax §7):
  1. Apple "placeholder content" (2.1) — mock data **real görünməlidir**;
  2. Apple 4.2 "minimum functionality" — tətbiq sadəcə veb saytın bükülmüş versiyası olmamalıdır;
  3. Apple hesabı **Individual**-dır. Tənzimlənən məhsul satışı üçün Apple şirkət hesabı istəyə bilər;
  4. Google Play hesabı personal və 2023-11-13-dən sonra açılıbsa, **12 tester × 14 gün** qapalı test tələbi var.
- **Strategiya:** ilk build-i review-a tez göndəririk. Apple-da "Manually release", Google-da "Managed publishing" seçirik. Review keçir, amma biz real data hazır olana qədər public etmirik.

---

## 1. Dizayn sənədinin analizi

`AlcoStore_design.html` bir dizayn canvas-ıdır (React runtime ilə paketlənmiş statik lövhə). Onda **5 ekran** var:

| # | Ekran | Əsas elementlər |
|---|---|---|
| 01 | Mobil · Ana səhifə | loqo, "ŞƏRAB EVİ · BAKI", açıq/bağlı statusu (10:00–23:00), axtarış, kateqoriya çipləri, kampaniya banneri, "Populyar" grid (2 sütun), tab bar: Ana / Kataloq / Səbət |
| 02 | Mobil · Kateqoriya (Viski) | geri düyməsi, məhsul sayı, sort/filter çipləri (Qiymət ↑, Ölkə, Həcm), siyahı |
| 03 | Mobil · Məhsul kartı | böyük foto, kateqoriya · ölkə, ad, **həcm variantları** (stokda olmayan boz görünür), qiymət və köhnə qiymət (endirim), təsvir, spesifikasiyalar (Spirt %, Ölkə, Qutu, Stok), "Səbətə at" + "WhatsApp" |
| 04 | Mobil · Səbət → WhatsApp | miqdar stepper-i, məbləğlər, çatdırılma (Bakı, pulsuz), WhatsApp-a gedən mətnin önizləməsi, "Sifarişi WhatsApp-a göndər" |
| 05 | Veb · masaüstü (1440) | top nav, hero ("Kataloqdan seç, sifarişi WhatsApp-da tamamla"), 4 sütunlu kataloq, footer: "Spirtli içkilərin 18 yaşdan kiçiklərə satışı qadağandır" |

**Dizayn sistemi**
- Yalnız tünd tema.
- Fon `#0E0C0B` / `#050403`, səthlər `#171413` / `#1F1A18`, mətn `#F2EDE7`.
- Brend qırmızı `#E31E24`, qızılı (qiymətlər) `#D9A441`, WhatsApp yaşıl `#25D366`.
- Şriftlər: **DM Sans** (UI), **Instrument Serif** (başlıqlar), **DM Mono** (etiketlər, uppercase).
- Radius: kart 14–16, düymə 12–15, pill 999.
- Valyuta `₼`, format `89,00 ₼`. Dil: yalnız Azərbaycan dili.

**Kateqoriyalar:** Şərab, Viski, Konyak, Araq, Pivə, Şampan.

**Dizaynda olmayan, amma əlavə etməli olduğumuz şeylər**

| Nə | Niyə |
|---|---|
| **Yaş təsdiqi ekranı (18+)** | Hər iki store üçün praktiki olaraq məcburidir |
| Məxfilik siyasəti, istifadə şərtləri, "məsuliyyətli istehlak" qeydi | Store tələbi |
| Push notification icazə axını və "Bildirişlər" ayarı | Sənin tələbin |
| Sevimlilər, axtarış nəticələri ekranı, "Hamısı" ekranı | Apple 4.2 üçün native dəyər |
| Parametrlər ekranı (dil, bildirişlər, əlaqə, hüquqi linklər, versiya) | Standart tələb |
| Boş / xəta / yüklənmə vəziyyətləri, offline vəziyyət | Keyfiyyət |
| İkonlar (dizaynda boş kvadratlardır) | TurMat kimi `lucide-react-native` istifadə edəcəyik |
| Məhsul fotoları (dizaynda placeholder-dir) | Mock data üçün belə **real foto lazımdır** (bax §7.2) |

---

## 2. Arxitektura (TurMat modeli ilə)

```
AlcoStore/  (monorepo, npm workspaces)
├── api/                    Cloudflare Worker · Hono · D1 (SQLite) · R2
├── alcostore-mobile/       Expo (iOS + Android) · EAS Build/Submit/Update
├── alcostore-web/          Next.js 16 (App Router) · Tailwind v4 · shadcn/ui · OpenNext → Cloudflare Pages
│   └── src/app/admin/      Admin panel (Telegram Login Widget)
├── packages/shared/        (yeni) ortaq tiplər, formatPrice, WhatsApp mətn generatoru, dizayn tokenləri
├── docs/
├── .github/workflows/
├── agent.md / CLAUDE.md    AI qaydaları (TurMat-dakı agent.md-dən adaptasiya)
└── package.json            workspaces
```

**Məlumat axını**

```
[Mobil app] ─┐
             ├──HTTPS──► [api.alcostore.az : Worker/Hono] ──► D1 (məhsullar, sifarişlər, cihazlar)
[Veb sayt]  ─┘                    │                        └► R2 → cdn.alcostore.az (foto)
                                  ├──► Expo Push API ──► FCM / APNs
[Admin /admin] ──Telegram login──►│
                                  └──► Telegram Bot → admin-lərə "yeni sifariş" bildirişi
Səbət → wa.me/<nömrə>?text=...  (müştəri WhatsApp-da yazır)
```

TurMat-dan fərqli və ya əlavə olaraq təklif etdiklərim:
1. **`packages/shared`**: TurMat-da mobil və veb kodu ayrı-ayrı təkrarlanır. Burada tiplər, qiymət formatı və WhatsApp mətni bir yerdə olacaq.
2. **Admin mobil tətbiqi indi olmayacaq.** Admin yalnız vebdə olacaq (mobil brauzerdə də işləyir). Lazım olsa sonra TurMat-dakı kimi Android APK edərik.
3. **Sifariş "lead" kimi qeyd olunur.** Müştəri "WhatsApp-a göndər" basanda tətbiq eyni zamanda `POST /orders` edir. Beləliklə admin paneldə sifariş tarixçəsi olur və Telegram-a bildiriş gedir. Bu, WhatsApp-dan əlavə bir izləmə imkanıdır.

---

## 3. Texnologiya stack-i

| Sahə | Seçim | TurMat-da |
|---|---|---|
| Mobil | Expo + React Native, TypeScript, new architecture | SDK 54 / RN 0.81 |
| Expo SDK versiyası | **Təklif: layihəni açdığımız gün ən son stabil SDK.** Yeni layihədir, sonra upgrade yükü olmasın | 54 |
| Naviqasiya | **Təklif: `expo-router`** (deep link, veb URL-lərə uyğunluq). TurMat-da custom naviqasiya var. Eynisini istəsən, onu da edə bilərik | custom |
| State | React Context + sadə hook-lar. Səbət `AsyncStorage`-də saxlanır | Context |
| UI | custom tokenlər (dizayndan), `lucide-react-native`, `expo-image`, `@shopify/flash-list`, `react-native-svg` | eyni |
| Şriftlər | `expo-font` + `@expo-google-fonts/dm-sans`, `instrument-serif`, `dm-mono` | — |
| i18n | i18next. Başlanğıcda `az`, struktur `ru` (və `en`) üçün hazır | az, ru |
| Push | `expo-notifications` + Expo Push API (FCM + APNs) | eyni |
| Update | `expo-updates`, `runtimeVersion: appVersion`, kanallar: development / production | eyni |
| Crash/analytics | Firebase Crashlytics + Analytics (sonra). Başlanğıcda sadəcə Crashlytics | Firebase |
| Veb | Next.js 16, Tailwind v4, shadcn/ui, OpenNext → Cloudflare Pages | eyni |
| API | Cloudflare Workers + Hono, JWT, raw SQL | eyni |
| DB | Cloudflare D1: `alcostoreDb`, `alcostoreDb-dev`, `alcostoreDb-local` | eyni |
| Fayllar | R2: `alcostore-imgs`, `alcostore-imgs-dev` → `cdn.alcostore.az` | eyni |
| Local dev | Cloudflare Tunnel (`local-api.alcostore.az` və s.), `start-local.ps1` | eyni |
| Paket meneceri | npm workspaces, Node 22, `.nvmrc` əlavə edəcəyik (TurMat-da yoxdur) | npm |
| Commit | Husky + Conventional Commits | eyni |

---

## 4. Data modeli (ilkin)

```sql
categories   (id, slug, name_az, name_ru, sort, icon, is_active)
products     (id, slug, category_id, brand, name, description_az, description_ru,
              country, abv, has_gift_box, is_active, is_featured, sort, created_at, updated_at)
product_variants (id, product_id, volume_ml, pack_size, price, old_price, stock, sku, is_active)
product_images   (id, product_id, r2_key, sort)
banners      (id, title, subtitle, image_key, link, starts_at, ends_at, is_active)
store_settings (key, value)   -- whatsapp_number, open_hours, delivery_text, free_delivery_min...
orders       (id, device_id, items_json, total, source['ios'|'android'|'web'], created_at, status)
devices      (id, device_id, platform, push_token, locale, created_at, last_seen_at)
notification_logs (id, title, body, target, sent_count, created_at)
admins       -- ADMIN_TELEGRAM_IDS env-də (TurMat kimi), cədvələ ehtiyac yoxdur
```

Dizayndakı həcm variantları (0.5 / 0.7 / 1 L və "yoxdur") `product_variants` ilə həll olunur. Endirim `old_price` ilə göstərilir. Stok `stock` sahəsindədir.

**Mock data** `api/migrations/seed/` altında SQL kimi saxlanır:
- dizayndakı ~15 məhsul (Chivas Regal 12, Hennessy VS, Savalan Merlot, Beluga Noble, Corona Extra, Moët, Jameson, Jack Daniel's, Glenfiddich 12, Ballantine's…);
- hər kateqoriyaya 6–10 məhsul, ümumilikdə ~50 məhsul;
- real qiymət diapazonları.

Seed yalnız dev və ilk prod üçündür. Real data gələndə admin paneldən dəyişdirilir və ya silinir.

---

## 5. Funksionallıq — MVP (store-a gedəcək ilk versiya)

**Mobil (iOS + Android)**
1. Splash → **Yaş təsdiqi** ("18 yaşım var" / "Xeyr"). "Xeyr" seçiləndə giriş bloklanır. Seçim yadda saxlanır.
2. Push icazəsi: birbaşa sistem pəncərəsi yox, əvvəlcə izah ekranı ("Kampaniyalardan xəbərdar ol"), sonra sistem icazəsi.
3. Ana səhifə: banner, kateqoriyalar, populyar məhsullar, açıq/bağlı statusu.
4. Kataloq: kateqoriyalar, siyahı, sort (qiymət), filter (ölkə, həcm), axtarış.
5. Məhsul kartı: foto qalereyası, variantlar, endirim, spesifikasiyalar, səbətə atma, birbaşa WhatsApp.
6. Səbət: stepper, cəm, WhatsApp mətninin önizləməsi → `wa.me` linki + `POST /orders`.
7. Sevimlilər (lokal).
8. Profil/Ayarlar: bildirişlər, dil (hazırlıq), əlaqə (WhatsApp, zəng), məxfilik, şərtlər, versiya.
9. Deep link: `alcostore://product/<slug>` və `https://alcostore.az/p/<slug>` (push kliki buraya aparır).
10. OTA update (EAS Update).

**Hesab / login yoxdur.** Müştəri TurMat-dakı kimi anonim `device_id` ilə işləyir. Bunun üstünlükləri:
- Apple 5.1.1(v) "hesab silmə" tələbi düşmür;
- 4.8 "Sign in with Apple" tələbi düşmür;
- review daha sürətli keçir.

**Veb (alcostore.az)**
- Dizayndakı desktop ekranı, eyni kataloq, məhsul səhifələri (SEO, ISR), səbət → WhatsApp.
- Yaş təsdiqi modalı.
- Store üçün vacib səhifələr: `/privacy`, `/terms`, `/support`, `/data-deletion`.
- Mobilə yönləndirmə: "App Store / Google Play" düymələri (app çıxandan sonra).

**Admin (`alcostore.az/admin`)**
- Telegram Login Widget → API hash-i yoxlayır → `ADMIN_TELEGRAM_IDS` whitelist-ə baxır → JWT verir. Bu, TurMat-dakı eyni axındır.
- Məhsullar: CRUD, variantlar, foto yükləmə (R2), aktiv/deaktiv, "populyar".
- Kateqoriyalar, bannerlər, mağaza ayarları (WhatsApp nömrəsi, iş saatları, çatdırılma mətni).
- Sifarişlər (lead) siyahısı və status.
- **Push göndərmə:** hamıya və ya test cihazına; başlıq, mətn, məhsula link.
- Telegram bot: yeni sifariş olanda admin-lərə mesaj gəlir.

**MVP-dən sonra:** rus dili, login (telefon/OTP), sifariş tarixçəsi, loyallıq, tətbiqdaxili ödəniş (lokal bank / kart; bu store review-u dəyişdirir), Meta/TikTok atribusiyası.

---

## 6. Hesablar və infrastruktur

| Xidmət | Nə edirik | Qeyd |
|---|---|---|
| **GitHub** | `AzerAskerov/AlcoStore` (private) | TurMat-dakı kimi personal hesab. Token-i `.git/config`-də URL-in içində **saxlamırıq**, credential manager istifadə edirik |
| **Expo / EAS** | hesab `azeraskerov`, yeni layihə `alcostore` | ~~yeni hesab~~ lazım deyil. Eyni plan kifayətdir (build limitlərinə baxmaq lazımdır) |
| **Apple Developer** | mövcud Team `UVU22NWY28` (Individual) **və ya** yeni Organization hesabı | ⚠️ §7.3-ə bax. Seçim sənindir |
| **App Store Connect** | yeni app. Bundle: `app.alcostore.ios` (dev: `.dev`) | Bundle ID sonra dəyişmir. Adı indi təsdiqləmək lazımdır |
| **APNs** | mövcud `.p8` key komanda səviyyəsindədir, eyni key-i istifadə edə bilərik | Org hesabı açsaq, yeni key lazımdır |
| **Google Play Console** | yeni app, package `app.alcostore.android` (dev: `.dev`) | ⚠️ 12 tester qaydası (§7.4). Service account JSON (TurMat kimi) |
| **Firebase** | yeni layihə `alcostore` → `google-services.json`, `GoogleService-Info.plist`, FCM V1 service account → EAS | — |
| **Cloudflare** | eyni hesab: Workers (`alcostore-api`, `alcostore-api-dev`), Pages (`alcostore-web`, `alcostore-web-dev`), D1, R2, DNS, Tunnel | domen Cloudflare DNS-ə keçməlidir |
| **Domen** | `alcostore.az` (dizayndakı) → `api.`, `dev.`, `dev-api.`, `cdn.`, `cdn-dev.`, `local-*` | ❓ alınıb? |
| **Telegram** | yeni botlar: `@alcostore_bot` (prod), `@alcostore_dev_bot`, `@alcostore_local_bot` + BotFather `/setdomain` | admin login + bildirişlər |
| **WhatsApp** | mağazanın real nömrəsi (WhatsApp Business tövsiyə olunur) | ❓ nömrə |

**Adlandırma (eyniadlılığın qarşısını almaq üçün):**
- app adı "Alco Store" (dev: "Alco Store (Dev)");
- scheme `alcostore`;
- EAS slug `alcostore`;
- Apple-da "Alco Store" adı artıq tutulubsa, "Alco Store Bakı" kimi alternativ ad lazım olacaq.

---

## 7. Store review — risklər və həll yolları (ən vacib bölmə)

### 7.1 Alkoqol satışına ümumiyyətlə icazə varmı?
- **Apple 1.4.3:** qadağan olunanlar tütün/vape satışı, narkotik və **həddindən artıq** alkoqolun təşviqidir. Qanuni alkoqol satışı qadağan deyil. App Store-da çoxlu alkoqol çatdırılma tətbiqi var.
- **Google Play (Tobacco & Alcohol):** qadağan olunanlar tütün/nikotin satışı, azyaşlılara alkoqol, həddindən artıq içkinin müsbət təsviri və "qeyri-qanuni və ya uyğunsuz istifadənin" təşviqidir. Alkoqol satışının özü qadağan siyahısında yoxdur.
- **Nəticə:** icazə var. Şərtlər:
  - 18+ reytinq;
  - yaş təsdiqi;
  - "məsuliyyətli istehlak" dili;
  - "iç, sərxoş ol" tipli marketinq yoxdur (bannerlərdə də).

### 7.2 Mock data ilə göndərmək olarmı? (Apple 2.1 / 2.3)
Apple 2.1(a): *"placeholder text, empty websites, and other temporary content should be scrubbed before submission."*

Mock datanı **real mağaza datası kimi** hazırlasaq problem yoxdur. Rəyçi datanın "mock" olduğunu bilmir və maraqlanmır. O, tətbiqin tam işləyib-işləmədiyinə baxır. Qaydalar:
- "Test", "Lorem ipsum", "Product 1" kimi mətnlər **olmamalıdır**;
- **boş şüşə placeholder-ləri olmamalıdır**, real məhsul fotoları lazımdır. ❓ Fotoları kim təmin edəcək? Mağazanın öz çəkilişi ən təhlükəsizidir. Distribyutor/brend foto-ları adətən satış üçün icazəlidir, amma internetdən təsadüfi götürmək olmaz;
- bütün düymələr işləməlidir: WhatsApp düyməsi **real, cavab verən nömrəyə** getməlidir. "+994 50 000 00 00" ilə göndərmək rədd səbəbidir;
- məxfilik siyasəti və support URL-i canlı olmalıdır (`alcostore.az/privacy`, `/support`).

Data API-dən gəldiyi üçün mock → real keçid **heç bir yeni review tələb etmir**.

### 7.3 Apple 4.2 "Minimum functionality" və WhatsApp modeli
Tətbiq "sadəcə kataloq + WhatsApp linki" kimi görünsə, 4.2 riski var. Bunu azaltmaq üçün:
- native naviqasiya, axtarış/filter, sevimlilər, lokal səbət;
- push bildirişlər, deep link;
- WebView **istifadə etmirik**.

Review Notes-da aydın yazırıq: *"Store with delivery in Baku. Orders are confirmed via WhatsApp; payment on delivery. No account required. Age gate at launch."*

### 7.4 Apple hesabı: Individual yoxsa Organization?
- Apple 5.1.1(ix) yüksək tənzimlənən sahələri (bank, səhiyyə, qumar, kannabis…) **şirkət tərəfindən** təqdim olunmağı tələb edir. Alkoqol bu siyahıda adı ilə yoxdur. Amma rəyçilər alkoqol satışında tez-tez **satış lisenziyası** və "tətbiqin sahibi satıcının özüdürmü" sualını verirlər.
- App Store-da "Seller" kimi **sənin adın** (AZER ASGEROV) görünəcək. Bu, mağazanın brendi ilə uyğun gəlməyəcək.
- **Tövsiyə:** mağazanın hüquqi şəxsi (MMC / VÖEN) varsa, **Apple Organization hesabı** açırıq. Bunun üçün D-U-N-S nömrəsi lazımdır; pulsuzdur, 1–2 həftə çəkir. İndidən başlamaq lazımdır.
- Hüquqi şəxs yoxdursa, mövcud Individual hesabla göndəririk. Rədd olunsa, lisenziya sənədi (mağazanın alkoqol satış icazəsi / VÖEN) Resolution Center-ə yüklənir. ❓ Mağazanın lisenziyası kimin adınadır?

### 7.5 Google Play: 12 tester × 14 gün
- 2023-11-13-dən sonra açılmış **personal** Play hesabları production-a çıxmazdan əvvəl ən azı **12 testerlə 14 gün fasiləsiz closed test** keçirməlidir.
- **Organization** hesabları bu tələbdən azaddır.
- ❓ TurMat-ın Play hesabı nə vaxt və hansı tiplə açılıb? Personal və yenidirsə, **closed test-i ilk gün başladırıq**. Bu, 14 günlük saatı mock data ilə işə salır. Sənin tələbin də məhz budur.
- Play-də doldurulacaqlar:
  - Content rating (IARC): alkoqol istinadı → 18+;
  - Target audience: **yalnız 18+**;
  - Data safety forması;
  - "App access" (login yoxdur);
  - Ads: yox.

### 7.6 Yaş reytinqi
- **Apple:** yeni reytinq sistemində "Alcohol, Tobacco, or Drug Use or References: Frequent" + alkoqol satışı → **18+**.
- **Google:** IARC anketində alkoqol satışı → 18 (PEGI 18 / Mature).

### 7.7 Digər tələblər
- Ödəniş tətbiqdə yoxdur, IAP məsələsi yoxdur (3.1.3(e) fiziki mallar üçün onsuz da IAP tələb etmir).
- `ITSAppUsesNonExemptEncryption: false`.
- Tracking yoxdur → ATT prompt yoxdur (Meta SDK əlavə etməsək).
- iPad: `supportsTablet: false`. iPad screenshot-ları tələb olunmur və review daha sadə keçir.
- Screenshot-lar: iPhone 6.9" və Play telefon screenshot-ları, feature graphic 1024×500. TurMat-dakı `turmatpartner/make_*_screenshots.ps1` skriptlərini adaptasiya edəcəyik.
- Azərbaycan qanunvericiliyi (distant satış, 18+, reklam məhdudiyyətləri) texniki deyil, hüquqi məsələdir. ❓ Mağaza bunu yoxlamalıdır.

### 7.8 "Tez göndər, sonra aç" strategiyası
1. **Apple:** TestFlight internal (review yoxdur) → daxili yoxlama → App Store review, **"Manually release this version"**. Təsdiqdən sonra "Pending Developer Release" statusunda gözləyir, real data hazır olanda bir düymə ilə açırıq.
2. **Google:** Internal testing → **Closed testing** (12 tester, 14 gün saatı başlayır) → production-a müraciət. **Managed publishing** aktiv olur, təsdiqdən sonra biz "Publish" basanda açılır.
3. Real datanı admin paneldən daxil edirik. Kod dəyişikliyi varsa, EAS Update ilə göndəririk. Store-da yeni review lazım deyil (native dəyişiklik yoxdursa).

---

## 8. CI/CD (TurMat-dakı workflow-ların kopyası)

| Workflow | Trigger | Nə edir |
|---|---|---|
| `deploy-web.yml` | push/PR: `alcostore-web/**`, `api/**`, `packages/shared/**` | wrangler dry-run → D1 migrations (dev/prod) → Worker deploy → OpenNext build → Pages deploy (`alcostore-web` / `alcostore-web-dev`) |
| `deploy-mobile.yml` | push: `alcostore-mobile/**` | yalnız JS dəyişibsə `eas update` (channel `development` / `production`). Native dəyişibsə PR-a "manual build lazımdır" şərhi yazır |
| `release-mobile-store.yml` | manual, `master`, environment `production-mobile` | version bump → `eas build --profile production` → `eas submit` (iOS + Android) → ASC "What's New" → tag `mobile-v*` |
| `ci.yml` (yeni) | hər PR | typecheck + lint + test (hər workspace) |

**Branch-lər:** `development` → DEV, `master` → PROD, TurMat-dakı kimi.

**Secrets:**
- `EXPO_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`;
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, `EXPO_ASC_API_KEY_P8`, `EXPO_ASC_API_KEY_ID`, `EXPO_ASC_API_KEY_ISSUER_ID`.

**Worker secrets:** `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `ADMIN_TELEGRAM_IDS`, `TELEGRAM_ADMIN_CHAT_ID`.

**eas.json profilləri:**
- `development`: dev client, internal, API `dev-api`;
- `preview`: internal APK, test üçün;
- `production`: store, AAB, `autoIncrement`, `appVersionSource: remote`.

---

## 9. TurMat-dan kopyalamayacağımız şeylər (təhlükəsizlik)

TurMat-ı araşdırarkən bunlar göründü. AlcoStore-da təkrarlamırıq, TurMat-da da düzəltmək lazımdır:
1. **`TurMat/.git/config`-də `origin` URL-inin içində GitHub personal access token** açıq mətnlə saxlanır. Token revoke edilməli və credential manager-ə keçilməlidir.
2. Reklam credential faylları git-ə commit olunub: `api/config/meta-ads-credentials.json` və `google-ads-credentials.json`.
3. Admin mobil tətbiqdə `AUTH_BYPASS = true` var və public `/config/admin-bootstrap` endpoint-i admin JWT qaytarır. AlcoStore-da admin **yalnız** Telegram login ilə açılacaq.
4. Signing faylları (`.jks`, `.p8`) repo qovluğunda yatır. Git-də track olunmurlar, amma repodan kənarda (EAS credentials / password manager) saxlamaq daha yaxşıdır.

---

## 10. İş planı (mərhələlər)

| Mərhələ | İş | Nəticə |
|---|---|---|
| **0. Hazırlıq** (sənin tərəfin, paralel) | domen, WhatsApp nömrəsi, Apple org hesabı qərarı / D-U-N-S, Play hesab tipi, Telegram botları, loqo (1024 px), məhsul fotoları | hesablar hazır |
| **1. Skelet** | monorepo, workspaces, shared paket, dizayn tokenləri, lint/TS, husky, CI | boş, amma deploy olunan layihə |
| **2. API + DB** | D1 sxemi, migrations, mock seed, public endpoint-lər (kataloq, məhsul, banner, ayarlar), `/orders`, `/devices/register`, push servisi | `dev-api.alcostore.az` |
| **3. Mobil MVP** | §5-dəki ekranlar, age gate, push, deep link, səbət → WhatsApp | dev build (iOS + Android) |
| **4. Veb + Admin** | vitrin, hüquqi səhifələr, Telegram login, CRUD, foto yükləmə, push göndərmə | `dev.alcostore.az`, `/admin` |
| **5. Store hazırlığı** | ikon, splash, screenshot-lar, store mətnləri (az / en), privacy, IARC, Data safety, review notes | listing-lər hazır |
| **6. Submit** | TestFlight + Play closed test → review → **manual/managed release** | təsdiqlənmiş, amma gizli |
| **7. Real data** | admin-dən real kataloq → public release | canlı |

Mərhələ 1–4 kod tərəfidir və ardıcıl gedir. Mərhələ 0 dərhal başlamalıdır: Apple org hesabı və Play 14 günlük test ən uzun çəkən işlərdir.

---

## 11. Sənə suallar (qərar lazımdır)

1. **Hüquqi şəxs:** mağazanın MMC / VÖEN-i və alkoqol satış lisenziyası varmı? Apple-da Organization hesabı açaq, yoxsa mövcud Individual hesabınla gedək?
2. **Google Play hesabı:** TurMat-ın Play hesabı personal-dır, yoxsa organization? Nə vaxt açılıb? (12 tester qaydası buna görə tətbiq olunur və ya olunmur.)
3. **Domen:** `alcostore.az` alınıb? Mağazanın adı son olaraq "Alco Store"-dur?
4. **Bundle ID-lər:** `app.alcostore.ios` / `app.alcostore.android` uyğundurmu? (Sonra dəyişmək olmur.)
5. **WhatsApp nömrəsi** — review üçün real, cavab verən nömrə lazımdır.
6. **Məhsul fotoları** — mağaza çəkəcək, yoxsa distribyutor verəcək?
7. **Naviqasiya:** `expo-router` (tövsiyə), yoxsa TurMat-dakı kimi custom?
8. **Dil:** ilk versiya yalnız `az`, yoxsa `az + ru`?
9. **Admin:** yalnız veb admin kifayətdir, yoxsa TurMat-dakı kimi Android admin APK da lazımdır?
10. **Çatdırılma qaydaları:** yalnız Bakı? Minimum məbləğ? Pulsuz çatdırılma həddi? (Dizaynda "iki şüşə şərab — pulsuz" var.)

---

## Mənbələr
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — 1.4.3, 2.1, 2.3.1, 3.1.3(e), 4.2, 4.8, 5.1.1(v), 5.1.1(ix)
- [Google Play — Tobacco and Alcohol policy](https://support.google.com/googleplay/android-developer/answer/9878810?hl=en)
- [Google Play — App testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- TurMat: `docs/ENVIRONMENTS.md`, `docs/PUSH_NOTIFICATIONS.md`, `docs/APNS_SETUP_GUIDE.md`, `docs/FCM_SETUP_GUIDE.md`, `.github/workflows/*`
