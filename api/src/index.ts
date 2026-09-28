import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from './env'
import { adminRoutes } from './routes/admin'
import { publicRoutes } from './routes/public'

const app = new Hono<AppEnv>()

app.use('*', async (c, next) => {
  const allowed = c.env.CORS_ORIGINS.split(',').map((s) => s.trim())
  return cors({
    // Mobil tətbiq Origin göndərmir; brauzerlər üçün whitelist.
    origin: (origin) => (allowed.includes(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })(c, next)
})

app.route('/', publicRoutes)
app.route('/admin', adminRoutes)

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status)
  console.error('[api] unhandled', err)
  return c.json({ error: 'Server xətası' }, 500)
})

export default app
