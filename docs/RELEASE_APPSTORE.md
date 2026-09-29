# App Store-a çıxış — addım-addım plan (iOS)

> Qayda: **bir addım → istifadəçi yoxlayır və "ok" deyir → növbəti addım.** Heç bir addımı atlama, iki addımı birləşdirmə.
> Hər addımın sonunda nəyin edildiyini, nəyin yoxlandığını və istifadəçidən nə lazım olduğunu qısa yaz.
> İnfrastruktur/CI/release məsələlərində əvvəlcə TurMat-a bax (`C:\Users\asgaroff\Documents\OwnProjects\TurMat` — `turmat-mobile/eas.json`, `app.config.js`, `scripts/ascSubmitForReview.mjs`, `.github/workflows/release-mobile-store.yml`, `docs/APNS_SETUP_GUIDE.md`) və işləyəni təkrarla (təhlükəsizlik səhvləri xaric).
> Dev mühiti YOXDUR — yalnız prod. EAS build / submit / App Review / Apple Developer resursu yaratmazdan əvvəl istifadəçidən açıq təsdiq al.
> Android paralel gedir: `docs/RELEASE_PLAYSTORE.md`. `app.config.js`, `eas.json`, workflow-lara toxunmazdan əvvəl `git pull`, kiçik commit-lər.

## Hazırkı vəziyyət (2026-09-29)

| Nə | Vəziyyət |
|---|---|
| Prod API / veb | ✅ https://alco.turmat.az/health → `{"ok":true,"env":"production"}`; https://alcoweb.turmat.az — `/privacy`, `/support`, `/data-deletion` 200 |
| Hesablar | Apple Developer: TurMat-ın hesabı — faktiki Team **`BU35T35W2N`** (TurMat prod `app.turmat.ios` da bu team-dədir; TurMat docs-dakı `UVU22NWY28` köhnədir). Expo `azeraskerov`, EAS projectId `100319b1-a3a2-46cd-9d72-ec96408f968e`. Yeni hesab açılmır |
| iOS konfiq | Bundle `app.alcostore.ios`, `supportsTablet: false`, deploymentTarget 16.4, `ITSAppUsesNonExemptEncryption: false`, `NSUserSupportURL` → `https://alcoweb.turmat.az/support` ✅ (Addım 0-da düzəldildi) |
| associatedDomains | `applinks:alcostorebaku.az` (+www) — **saxlanılır** (qərar 2026-09-29). Domen alınanda veb-ə AASA qoyulur, yeni build lazım deyil |
| Push (iOS) | `GoogleService-Info.plist` lazım deyil (Expo push APNs ilə birbaşa). EAS-da TurMat-ın push key-i `K75TWSWA52` (team BU35T35W2N) var — alcostore-a qoşulub ✅ |
| GitHub | Secrets: `EXPO_TOKEN` ✅; `EXPO_ASC_API_KEY_P8/_ID/_ISSUER_ID` ✅ (ASC API key `RU83TVBK4U` "IosApiKey", issuer `de1b4c79-…`, TurMat ilə eyni); variable `ASC_APP_ID=6817231454` ✅ |
| eas.json | `submit.production.ios.ascAppId` = `6817231454` ✅ |
| Workflow | `release-mobile-store.yml` (platform=ios, ios_release=MANUAL) + `alcostore-mobile/scripts/ascSubmitForReview.mjs` (RELEASE_TYPE defolt MANUAL) hazırdır |
| EAS build | ✅ `faee6782-5fc2-4904-be8e-cdbfeff54331` — 1.0.0 (1), FINISHED (lokal `eas build`, EAS cloud) |
| ASC metadata | ✅ ASC API ilə (`scripts`-siz, birdəfəlik): age rating 18+ (Alcohol FREQUENT_OR_INTENSE, override EIGHTEEN_PLUS), kateqoriya Shopping / Food & Drink, subtitle, privacy URL, təsvir/açar sözlər/promo (en-US), support/marketing URL, copyright, versiya 1.0.0, releaseType MANUAL, review contact + notes, content rights, qiymət FREE, əlçatanlıq yalnız **Azərbaycan** |
| App Privacy | ✅ Dərc olunub: Device ID, Purchase History, Other User Content — hamısı App Functionality, istifadəçiyə bağlı deyil, tracking YOX |
| Screenshots | ✅ 5 × 6.9" (1320×2868) — `node scripts/make-appstore-screenshots.mjs` → `store-assets/appstore/`, ASC-ə yükləndi |

### ⚠️ Risklər (App Review)
- **5.1.1(ix)** — alkoqol satışı "highly regulated" sahədir: Apple Individual hesabdan lisenziya / hüquqi şəxs sübutu istəyə bilər. Mağazanın satış icazəsi sənədləri hazır olsun; lazım gələrsə Organization hesabı tələb oluna bilər.
- **4.2 Minimum functionality** — tətbiq sadəcə vebin bürüşü kimi görünməməlidir (kataloq, səbət, push — native funksiyalar var).
- **2.1 / placeholder** — kataloq real fotolarla olmalı; qiymətlər hələ təxminidir → istifadəçi real qiymətləri admin paneldən yazmalıdır (review-dan əvvəl).

---

## Addım 0 — Vəziyyəti yoxla + native düzəlişlər ✅ (2026-09-29, associatedDomains saxlanılır)
- Prod API/veb canlıdır (yuxarıdakı cədvəl).
- `app.config.js`: `NSUserSupportURL` → `https://alcoweb.turmat.az/support` (native dəyişiklik, build-dən əvvəl).
- `associatedDomains` `alcostorebaku.az`-a baxır — ya saxla (domen alınanda veb-də AASA faylı qoyulan kimi işə düşür, yeni build lazım deyil; o vaxta qədər zərərsizdir), ya da çıxar (sonra əlavə etmək yeni native build tələb edir).
- `.env.local` gitignore-dadır → EAS-a yüklənmir; prod build `eas.json` env-dən `https://alco.turmat.az` götürür.
- ✅ İstifadəçi "ok".

## Addım 1 — Apple: bundle ID, sertifikat, profile, APNs (EAS remote credentials) ✅ (2026-09-29)
- ⚠️ Təsdiq al (Apple Developer-də resurs yaradılır).
- `cd alcostore-mobile && eas credentials -p ios` → production → istifadəçi Apple ID ilə interaktiv login (parolu istifadəçi özü yazır).
  - Bundle ID `app.alcostore.ios` qeydiyyatı (+ Push Notifications, Associated Domains capability).
  - Distribution certificate: TurMat-ın mövcud sertifikatını təkrar istifadə et (team limiti 2-3).
  - Provisioning profile (App Store).
  - Push key: TurMat komandasının mövcud `.p8` APNs key-i (team səviyyəli) seç — `TurMat/docs/APNS_SETUP_GUIDE.md`.
- Vəziyyət (2026-09-29, EAS GraphQL ilə yoxlanıldı):
  - ✅ Bundle ID `app.alcostore.ios`
  - ✅ Distribution cert `JRWQSGB7F9` (serial `1D5CD175…`, TurMat ilə eyni, 2027-02-20-dək)
  - ✅ Provisioning profile `HD5G44TR83` (APP_STORE, active, 2027-02-20-dək)
  - ✅ Push key `K75TWSWA52` (TurMat-ın, team BU35T35W2N) qoşuldu
- ✅ `eas credentials -p ios` hamısını göstərir, istifadəçi "ok".

## Addım 2 — App Store Connect app qeydi (istifadəçi yaradır) ✅ (2026-09-29, ASC App ID `6817231454`)
- ✅ Yaradıldı: ad **Alco Store**, primary language **English (U.S.)** (Azerbaijani siyahıda yoxdur — az mətnlər sonra lokalizasiya kimi), bundle `app.alcostore.ios`, SKU `alcostore-ios`, Full Access.
- App Information → Apple ID (rəqəm) → `gh variable set ASC_APP_ID -R AzerAskerov/alcostore --body <ID>` və `eas.json` `submit.production.ios.ascAppId`.
- ✅ İstifadəçi "ok".

## Addım 3 — GitHub secrets (TurMat-dakı eyni dəyərlər, istifadəçi özü əlavə edir) ✅ (2026-09-29)
```
gh secret set EXPO_ASC_API_KEY_P8 -R AzerAskerov/alcostore < AuthKey_XXXX.p8
gh secret set EXPO_ASC_API_KEY_ID -R AzerAskerov/alcostore
gh secret set EXPO_ASC_API_KEY_ISSUER_ID -R AzerAskerov/alcostore
```
- `EXPO_TOKEN` ✅ artıq var.
- ✅ `gh secret list` yoxlanılır, istifadəçi "ok".

## Addım 4 — EAS production build (iOS) ✅ (2026-09-29, build `faee6782`)
- ⚠️ Təsdiq al → `release-mobile-store.yml` (platform=ios, ios_release=MANUAL) və ya `eas build -p ios --profile production`.
- ✅ Build FINISHED, istifadəçi "ok".

## Addım 5 — Submit → TestFlight (internal)
- ⚠️ Təsdiq al → `eas submit -p ios --profile production` (workflow bunu özü edir).
- İstifadəçi fiziki iPhone-da TestFlight ilə yoxlayır: yaş təsdiqi, kataloq, səbət → WhatsApp, push bildiriş (admin panel və ya API `/admin/notifications`).
- ✅ İstifadəçi "ok".

## Addım 6 — App Store məlumatları ✅ (2026-09-29, ASC API + App Privacy brauzerdə)
- Age rating: **18+** (Alcohol, Tobacco, or Drug Use or References: Frequent).
- App Privacy: Identifiers → Device ID (App Functionality, istifadəçiyə bağlı deyil); Purchases / Other User Content → sifariş tərkibi (App Functionality); Tracking: **YOX**.
- Privacy Policy URL `https://alcoweb.turmat.az/privacy`, Support URL `https://alcoweb.turmat.az/support`.
- Kateqoriya: Shopping (secondary Food & Drink).
- Mətnlər az/en — məsuliyyətli istehlak dili. Əlaqə: WhatsApp +994 50 682 21 71, Asif Məhərrəmov küç. 33A, Instagram @alcostore.baku.
- Screenshot-lar: 6.9" iPhone 1320×2868, ≥3 (iPad lazım deyil).
- Review Notes: "Alcohol store with delivery in Baku. No account required. Age gate at launch. Orders are sent via WhatsApp; payment on delivery; no in-app purchases."
- ✅ İstifadəçi "ok".

## Addım 7 — App Review-a göndər (releaseType MANUAL)
- ⚠️ Təsdiq al → `ascSubmitForReview.mjs` (`RELEASE_TYPE=MANUAL`) — workflow ilə.
- Təsdiqdən sonra "Pending Developer Release"; real data hazır olanda istifadəçi əl ilə açır.
- ✅ İstifadəçi "ok".
