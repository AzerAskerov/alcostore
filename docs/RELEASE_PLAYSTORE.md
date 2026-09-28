# Play Store-a çıxış — addım-addım plan

> Qayda: **bir addım → istifadəçi yoxlayır və "ok" deyir → növbəti addım.** Heç bir addımı atlama, iki addımı birləşdirmə.
> Hər addımın sonunda nəyin edildiyini, nəyin yoxlandığını və istifadəçidən nə lazım olduğunu qısa yaz.
> İnfrastruktur/CI/release məsələlərində əvvəlcə TurMat-a bax (`C:\Users\asgaroff\Documents\OwnProjects\TurMat`) və orada işləyəni təkrarla.
> Dev mühiti YOXDUR — yalnız prod. Deploy/build/submit addımlarından əvvəl istifadəçidən təsdiq al.

## Hazırkı vəziyyət (2026-09-28)

| Nə | Vəziyyət |
|---|---|
| Repo | `github.com/AzerAskerov/alcostore` (PUBLIC). `development` və `main` push olunub (main = prod). Köhnə dizayn `index.html` main-də qalır (GitHub Pages). Secrets: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`; environment `production-mobile` yaradılıb |
| Prod API | Cloudflare Worker `alcostore-api` → **https://alco.turmat.az** (custom domain, turmat.az zonası). D1 `alcostoreDb` (migrations 0001–0004), R2 `alcostore-imgs` (26 şəkil). SSL OK (Google TS, 2026-12-27-dək, avto-yenilənir). ✅ Addım 0 |
| Prod veb | ✅ **https://alcoweb.turmat.az** (Worker `alcostore-web`, OpenNext) — GitHub Actions `deploy-web.yml` ilə (main push). Deploy YALNIZ workflow ilə, lokal `wrangler deploy` yox. Privacy/support/data-deletion URL-ləri buradadır |
| Mobil | Expo SDK 57, `alcostore-mobile/`. EAS layihəsi `@azeraskerov/alcostore` (projectId `100319b1-a3a2-46cd-9d72-ec96408f968e`). Android package `app.alcostore.android`. EAS keystore + FCM V1 qurulub (Firebase `alcostore-485c7`); heç bir EAS build edilməyib. Lokal Expo Go testi keçib |
| Hesablar | TurMat-ın Apple / Google Play / Expo (`azeraskerov`) / Cloudflare (account `a151fd414815484846a2be6cbc8b8b48`) hesabları istifadə olunur — yeni hesab açılmır |
| Son domen | `alcostorebaku.az` (alınma prosesi davam edir). Keçid: wrangler route + EXPO_PUBLIC_API_URL (EAS Update kifayətdir) |

Dev resursları (`alcostore-api-dev`, `alcostore-web-dev`, `alcostoreDb-dev`, `alcostore-imgs-dev`) qalır, istifadə edilmir. Silmə.

---

## Addım 0 — Prod API-ni yoxla ✅ (2026-09-28)
- `curl https://alco.turmat.az/health` → `{"ok":true,"env":"production"}`
- `/home`: 6 kateqoriya (viski, konyak, araq, pivə, tekila, liker), bannerlər, məhsul şəkilləri `https://alco.turmat.az/media/...` 200 qaytarır.
- SSL xətası davam edirsə: Cloudflare → Workers → alcostore-api → Domains yoxla.
- ✅ İstifadəçi "ok" deyir.

## Addım 1 — Prod vebi `alcoweb.turmat.az`-a deploy et ✅ (2026-09-28, GitHub Actions ilə)
- `alcostore-web/wrangler.jsonc`: prod üçün `"routes": [{ "pattern": "alcoweb.turmat.az", "custom_domain": true }]`.
- Build env: `NEXT_PUBLIC_API_URL=https://alco.turmat.az`, `NEXT_PUBLIC_ENV=production`, `NEXT_PUBLIC_BASE_URL=https://alcoweb.turmat.az`.
- OpenNext Windows-da rəsmi dəstəklənmir → GitHub Actions (Addım 2) və ya WSL ilə build. `npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy`.
- Yoxla: `/`, `/privacy`, `/terms`, `/support`, `/data-deletion`, bir `/mehsul/...` səhifəsi.
- ✅ İstifadəçi brauzerdə baxıb "ok" deyir.

## Addım 2 — GitHub: push + prod-only workflow + secrets — qismən ✅ (push, prod-only workflow-lar, Cloudflare secrets, `production-mobile` env). Qalan: `EXPO_TOKEN`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
- `development` → `main` (PR və ya birbaşa, istifadəçidən soruş). `main`-dəki köhnə `index.html` (GitHub Pages dizaynı) saxlanılır.
- Workflow-ları prod-only et (`main`): `.github/workflows/deploy-web.yml`, `deploy-mobile.yml`, `release-mobile-store.yml`, `ci.yml`. URL defoltları: API `https://alco.turmat.az`, veb `https://alcoweb.turmat.az`.
- Secrets (istifadəçi özü əlavə edir — dəyərləri GitHub-dan oxumaq olmur; TurMat reposundakı eyni dəyərlər):
  `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `EXPO_TOKEN`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (+ iOS üçün sonra `EXPO_ASC_API_KEY_P8/_ID/_ISSUER_ID`).
  Əmr nümunəsi: `gh secret set EXPO_TOKEN -R AzerAskerov/alcostore`
- Environment: `production-mobile` (TurMat-dakı kimi).
- ⚠️ Repo PUBLIC-dir — secret-lər təhlükəsizdir, amma istifadəçiyə private etməyi təklif et (GitHub Pages dizayn linki itə bilər).
- ✅ CI yaşıl, istifadəçi "ok".

## Addım 3 — Expo/EAS prod konfiqurasiyası + Android credentials + FCM
- `alcostore-mobile/eas.json` production env: `EXPO_PUBLIC_API_URL=https://alco.turmat.az`, `EXPO_PUBLIC_WEB_URL=https://alcoweb.turmat.az`.
- Android keystore: EAS remote credentials (`eas credentials -p android` — ilk dəfə interaktivdir, istifadəçi ilə birlikdə).
- Push (FCM): Firebase layihəsi → `google-services.json` (package `app.alcostore.android`) + FCM V1 service account açarını EAS-a yüklə. Bax: `TurMat/docs/FCM_SETUP_GUIDE.md`.
- ✅ `eas credentials` və `eas env`/config yoxlanılır, istifadəçi "ok".

## Addım 4 — EAS production build (Android AAB)
- İstifadəçidən təsdiq al → `eas build --profile production --platform android`.
- Build linkini ver; AAB-ni endir (ilk yükləmə əl ilə olacaq).
- ✅ Build FINISHED, istifadəçi "ok".

## Addım 5 — Play Console: app yarat və "App content"
- İstifadəçi yaradır: app adı **Alco Store**, package `app.alcostore.android`, pulsuz, "App".
- Hesab tipini yoxla: personal və 2023-11-13-dən sonra açılıbsa → production-dan əvvəl **12 tester × 14 gün closed test** (docs/PLAN.md §7.5).
- App content (hazır cavablar):
  - Privacy policy: `https://alcoweb.turmat.az/privacy`
  - Ads: yoxdur · App access: bütün funksiyalar girişsiz
  - Content rating (IARC): alkoqol satışı/istinadı → 18+ · Target audience: yalnız 18+
  - Data safety: toplanır — cihaz ID (app functionality), push token (app functionality), sifariş tərkibi (app functionality); paylaşılmır; transitdə şifrələnir; silinmə sorğusu `https://alcoweb.turmat.az/data-deletion`
  - Government / financial / health: yox
- ✅ Hamısı "Completed", istifadəçi "ok".

## Addım 6 — Store listing materialları
- Başlıq: `Alco Store — Şərab evi` · Qısa təsvir (≤80) · Tam təsvir (az, en) — məsuliyyətli istehlak dili, "həddindən artıq içki" yox.
- İkon 512×512 (`scripts/make-assets.mjs` genişləndir), feature graphic 1024×500, telefon screenshot-ları (≥2, 9:16). TurMat nümunəsi: `C:\Users\asgaroff\Documents\turmatpartner\make_*_screenshots.ps1`.
- ✅ İstifadəçi materiallara baxıb "ok".

## Addım 7 — İlk AAB yükləmə + test track
- İlk AAB Play Console-a **əl ilə** (Google API ilə ilk yükləməyə icazə vermir) → Internal testing.
- Service account (TurMat-dakı) Play Console → Users & permissions-də yeni app-a icazə alır → sonrakı yükləmələr `release-mobile-store.yml` ilə.
- Closed testing (lazımdırsa 12 tester) → production review, **Managed publishing** aktiv (təsdiqdən sonra əl ilə açılır).
- ✅ İstifadəçi "ok".

## Sonra
- Admin panel prod girişi: Telegram bot (BotFather), `TELEGRAM_BOT_TOKEN`, `ADMIN_TELEGRAM_IDS` → `wrangler secret put`, `/setdomain alcoweb.turmat.az`.
- iOS / App Store (ayrı plan).
- Real qiymətlər, iş saatları, şərab/şampan şəkilləri (admin paneldən).
