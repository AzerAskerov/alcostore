// Dinamik Expo konfiqurasiyası (TurMat modeli).
// Mühit: EAS_BUILD_PROFILE / EAS_SUBMIT_PROFILE → EXPO_PUBLIC_ENV → 'production' (təhlükəsiz defolt).
// Dev build-in ayrıca bundle id-si və "(Dev)" adı var — prod ilə yan-yana quraşdırıla bilir.

const IS_EAS = Boolean(process.env.EAS_BUILD_PROFILE || process.env.EAS_SUBMIT_PROFILE || process.env.CI)
if (!IS_EAS) {
  try {
    require('dotenv').config({ path: '.env.local' })
  } catch {
    /* .env.local yoxdur */
  }
}

const PROFILE = process.env.EAS_BUILD_PROFILE || process.env.EAS_SUBMIT_PROFILE
const ENV =
  PROFILE === 'production' ? 'production' : PROFILE === 'development' ? 'development' : process.env.EXPO_PUBLIC_ENV || 'production'
const IS_DEV = ENV === 'development'

// EAS layihəsi: @azeraskerov/alcostore
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID || '100319b1-a3a2-46cd-9d72-ec96408f968e'

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || (IS_DEV ? 'https://dev-api.alcostore.az' : 'https://api.alcostore.az')

const fs = require('fs')
const path = require('path')
const has = (f) => fs.existsSync(path.resolve(__dirname, f))

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: IS_DEV ? 'Alco Store (Dev)' : 'Alco Store',
  slug: 'alcostore',
  owner: 'azeraskerov',
  version: '1.0.0',
  scheme: 'alcostore',
  orientation: 'portrait',
  icon: IS_DEV ? './assets/icon-dev.png' : './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0E0C0B',
  platforms: ['ios', 'android'],
  ios: {
    bundleIdentifier: IS_DEV ? 'app.alcostore.ios.dev' : 'app.alcostore.ios',
    supportsTablet: false,
    associatedDomains: IS_DEV ? ['applinks:dev.alcostore.az'] : ['applinks:alcostore.az', 'applinks:www.alcostore.az'],
    ...(has('GoogleService-Info.plist') ? { googleServicesFile: './GoogleService-Info.plist' } : {}),
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSUserSupportURL: 'https://alcostore.az/support',
      // WhatsApp-ın quraşdırılıb-quraşdırılmadığını yoxlamaq üçün
      LSApplicationQueriesSchemes: ['whatsapp'],
    },
  },
  android: {
    package: IS_DEV ? 'app.alcostore.android.dev' : 'app.alcostore.android',
    adaptiveIcon: {
      foregroundImage: IS_DEV ? './assets/adaptive-icon-dev.png' : './assets/adaptive-icon.png',
      backgroundColor: '#16181B',
    },
    predictiveBackGestureEnabled: false,
    permissions: ['INTERNET', 'POST_NOTIFICATIONS'],
    blockedPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE'],
    ...(has('google-services.json') ? { googleServicesFile: './google-services.json' } : {}),
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: (IS_DEV ? ['dev.alcostore.az'] : ['alcostore.az', 'www.alcostore.az']).flatMap((host) => [
          { scheme: 'https', host, pathPrefix: '/mehsul' },
          { scheme: 'https', host, pathPrefix: '/kateqoriya' },
        ]),
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      { image: './assets/splash-icon.png', imageWidth: 220, resizeMode: 'contain', backgroundColor: '#0E0C0B' },
    ],
    [
      'expo-notifications',
      { icon: './assets/notification-icon.png', color: '#E31E24', defaultChannel: 'default' },
    ],
    'expo-font',
    'expo-image',
    'expo-status-bar',
    'expo-web-browser',
    ['expo-build-properties', { ios: { deploymentTarget: '16.4' } }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    ...(EAS_PROJECT_ID ? { eas: { projectId: EAS_PROJECT_ID } } : {}),
    apiUrl: API_URL,
    env: ENV,
  },
  runtimeVersion: { policy: 'appVersion' },
  updates: {
    ...(EAS_PROJECT_ID ? { url: `https://u.expo.dev/${EAS_PROJECT_ID}` } : {}),
    enabled: Boolean(EAS_PROJECT_ID),
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
}

module.exports = { expo: config }
