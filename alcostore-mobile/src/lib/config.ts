import Constants from 'expo-constants'

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string; env?: string; eas?: { projectId?: string } }

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || extra.apiUrl || 'https://api.alcostore.az').replace(/\/$/, '')
export const APP_ENV = process.env.EXPO_PUBLIC_ENV || extra.env || 'production'
export const EAS_PROJECT_ID = extra.eas?.projectId
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'
export const WEB_URL = APP_ENV === 'production' ? 'https://alcostore.az' : 'https://dev.alcostore.az'
