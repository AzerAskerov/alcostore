export interface Bindings {
  DB: D1Database
  IMAGES_BUCKET: R2Bucket

  ENVIRONMENT: 'local' | 'development' | 'production'
  API_BASE_URL: string
  FRONTEND_URL: string
  R2_PUBLIC_URL: string
  CORS_ORIGINS: string

  JWT_SECRET: string
  TELEGRAM_BOT_TOKEN?: string
  ADMIN_TELEGRAM_IDS?: string
  TELEGRAM_ORDERS_CHAT_ID?: string
  EXPO_ACCESS_TOKEN?: string
  DEV_LOGIN_ENABLED?: string
}

export interface AdminClaims {
  sub: string
  username?: string
  first_name?: string
  role: 'admin'
  exp: number
}

export type AppEnv = {
  Bindings: Bindings
  Variables: { admin: AdminClaims }
}
