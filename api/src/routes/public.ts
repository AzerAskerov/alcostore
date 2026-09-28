import { Hono } from 'hono'
import type { HomePayload, ProductSort } from '@alcostore/shared'
import type { AppEnv } from '../env'
import { badRequest, notFound, readJson, toInt } from '../lib/http'
import { notifyOrderChannel } from '../lib/telegram'
import { getFacets, getProduct, listBanners, listCategories, listProducts } from '../services/catalog'
import { createOrder, orderTelegramHtml, validateOrderInput } from '../services/orders'
import { getSettings } from '../services/settings'

export const publicRoutes = new Hono<AppEnv>()

const SORTS: ProductSort[] = ['popular', 'price_asc', 'price_desc', 'name', 'new']

function cache(c: { header: (k: string, v: string) => void }, seconds = 60) {
  c.header('Cache-Control', `public, max-age=${seconds}, s-maxage=${seconds}`)
}

publicRoutes.get('/health', (c) => c.json({ ok: true, env: c.env.ENVIRONMENT }))

publicRoutes.get('/home', async (c) => {
  const base = c.env.R2_PUBLIC_URL
  const [settings, categories, banners, popular] = await Promise.all([
    getSettings(c.env.DB),
    listCategories(c.env.DB, base),
    listBanners(c.env.DB, base),
    listProducts(c.env.DB, base, { featured: true, page_size: 12 }),
  ])
  cache(c)
  return c.json<HomePayload>({ settings, categories, banners, popular: popular.items })
})

publicRoutes.get('/settings', async (c) => {
  cache(c)
  return c.json(await getSettings(c.env.DB))
})

publicRoutes.get('/categories', async (c) => {
  cache(c)
  return c.json(await listCategories(c.env.DB, c.env.R2_PUBLIC_URL))
})

publicRoutes.get('/banners', async (c) => {
  cache(c)
  return c.json(await listBanners(c.env.DB, c.env.R2_PUBLIC_URL))
})

publicRoutes.get('/products', async (c) => {
  const q = c.req.query()
  const sort = (q.sort as ProductSort) || 'popular'
  if (!SORTS.includes(sort)) badRequest('Yanlış sort')
  const result = await listProducts(c.env.DB, c.env.R2_PUBLIC_URL, {
    category: q.category || undefined,
    q: q.q || undefined,
    country: q.country || undefined,
    volume_ml: toInt(q.volume_ml),
    featured: q.featured === '1' || q.featured === 'true',
    sort,
    page: toInt(q.page, 1),
    page_size: toInt(q.page_size, 24),
  })
  cache(c, 30)
  return c.json(result)
})

publicRoutes.get('/products/facets', async (c) => {
  cache(c)
  return c.json(await getFacets(c.env.DB, c.req.query('category') || undefined))
})

publicRoutes.get('/products/:slug', async (c) => {
  const product = await getProduct(c.env.DB, c.env.R2_PUBLIC_URL, { slug: c.req.param('slug') })
  if (!product) notFound('Məhsul tapılmadı')
  cache(c, 30)
  return c.json(product)
})

publicRoutes.post('/orders', async (c) => {
  const input = validateOrderInput(await readJson(c.req))
  const settings = await getSettings(c.env.DB)
  const result = await createOrder(c.env.DB, settings, input)
  c.executionCtx.waitUntil(notifyOrderChannel(c.env, orderTelegramHtml(result.order, c.env.FRONTEND_URL)))
  return c.json(result, 201)
})

publicRoutes.post('/devices/register', async (c) => {
  const b = await readJson(c.req)
  const deviceId = typeof b.device_id === 'string' ? b.device_id.trim().slice(0, 100) : ''
  const platform = b.platform
  if (!deviceId) badRequest('"device_id" tələb olunur')
  if (platform !== 'ios' && platform !== 'android' && platform !== 'web') badRequest('Yanlış platform')
  const token = typeof b.push_token === 'string' && b.push_token ? b.push_token.slice(0, 200) : null
  const locale = typeof b.locale === 'string' ? b.locale.slice(0, 10) : null
  const appVersion = typeof b.app_version === 'string' ? b.app_version.slice(0, 20) : null
  const pushEnabled = b.push_enabled === false ? 0 : 1
  await c.env.DB.prepare(
    `INSERT INTO devices (device_id, platform, push_token, locale, app_version, push_enabled)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(device_id) DO UPDATE SET
       platform = excluded.platform,
       push_token = COALESCE(excluded.push_token, devices.push_token),
       locale = COALESCE(excluded.locale, devices.locale),
       app_version = COALESCE(excluded.app_version, devices.app_version),
       push_enabled = excluded.push_enabled,
       last_seen_at = datetime('now')`,
  )
    .bind(deviceId, platform, token, locale, appVersion, pushEnabled)
    .run()
  return c.json({ ok: true })
})

/** R2 şəkilləri (cdn domeni qoşulana qədər və local üçün). */
publicRoutes.get('/media/*', async (c) => {
  const key = decodeURIComponent(c.req.path.replace(/^\/media\//, ''))
  if (!key || key.includes('..')) notFound()
  const obj = await c.env.IMAGES_BUCKET.get(key)
  if (!obj) notFound()
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('etag', obj.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  return new Response(obj.body, { headers })
})
