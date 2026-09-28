import Constants from 'expo-constants'

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string; webUrl?: string; env?: string; eas?: { projectId?: string } }

// EXPO_PUBLIC_* JS bundle-a yazılır — domen dəyişəndə EAS Update kifayətdir, yeni store build lazım deyil.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || extra.apiUrl || 'https://alcostore-api.sigortamat90.workers.dev').replace(/\/$/, '')
export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || extra.webUrl || 'https://alcostore-web.sigortamat90.workers.dev').replace(/\/$/, '')
export const APP_ENV = process.env.EXPO_PUBLIC_ENV || extra.env || 'production'
export const EAS_PROJECT_ID = extra.eas?.projectId
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'
