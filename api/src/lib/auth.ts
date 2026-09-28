import jwt from '@tsndr/cloudflare-worker-jwt'
import type { MiddlewareHandler } from 'hono'
import type { AdminClaims, AppEnv } from '../env'

const ADMIN_TOKEN_TTL_SEC = 7 * 24 * 60 * 60

export async function signAdminToken(
  claims: Omit<AdminClaims, 'exp' | 'role'>,
  secret: string,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ADMIN_TOKEN_TTL_SEC
  return jwt.sign({ ...claims, role: 'admin', exp }, secret)
}

export async function verifyAdminToken(token: string, secret: string): Promise<AdminClaims | null> {
  try {
    const decoded = await jwt.verify<AdminClaims>(token, secret)
    const payload = decoded?.payload
    if (!payload || payload.role !== 'admin' || !payload.sub) return null
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

/** Bearer token tələb edir. Token Telegram whitelist-dən keçmiş admin-ə verilir. */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const claims = token ? await verifyAdminToken(token, c.env.JWT_SECRET) : null
  if (!claims) return c.json({ error: 'Giriş tələb olunur' }, 401)
  c.set('admin', claims)
  await next()
}
