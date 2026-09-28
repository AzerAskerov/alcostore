export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787').replace(/\/$/, '')
export const APP_ENV = process.env.NEXT_PUBLIC_ENV || 'local'
export const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
export const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || ''
export const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || ''
export const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL || ''
export const IS_PROD = APP_ENV === 'production'
