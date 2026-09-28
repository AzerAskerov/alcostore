import { Hono } from 'hono'
import { slugify, type AdminStats, type OrderStatus } from '@alcostore/shared'
import type { AppEnv } from '../env'
import { requireAdmin, signAdminToken } from '../lib/auth'
import { sendPush } from '../lib/expo-push'
import { badRequest, bool, notFound, optString, readJson, reqString, toInt, toNum } from '../lib/http'
import { parseAdminIds, pickTelegramFields, verifyTelegramAuth } from '../lib/telegram'
import { getProduct, imageUrl, listBanners, listCategories, listProducts, mapBanner } from '../services/catalog'
import { getOrder, listOrders } from '../services/orders'
import { getSettings, updateSettings } from '../services/settings'

export const adminRoutes = new Hono<AppEnv>()

const AUTH_MAX_AGE_SEC = 300
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Telegram Login Widget-in `onauth` məlumatı (JSON) → admin JWT. */
adminRoutes.post('/auth/telegram', async (c) => {
  const body = (await readJson(c.req)) as Record<string, string | undefined>
  const data = pickTelegramFields(Object.fromEntries(Object.entries(body).map(([k, v]) => [k, v === undefined ? undefined : String(v)])))
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ error: 'Telegram bot konfiqurasiya olunmayıb' }, 500)
  if (!(await verifyTelegramAuth(data, c.env.TELEGRAM_BOT_TOKEN))) return c.json({ error: 'invalid' }, 401)
  if (Math.floor(Date.now() / 1000) - Number(data.auth_date) > AUTH_MAX_AGE_SEC) return c.json({ error: 'expired' }, 401)
  if (!parseAdminIds(c.env.ADMIN_TELEGRAM_IDS).includes(data.id)) return c.json({ error: 'unauthorized' }, 403)
  const token = await signAdminToken(
    { sub: data.id, username: data.username, first_name: data.first_name },
    c.env.JWT_SECRET,
  )
  return c.json({ token, admin: { id: data.id, username: data.username, first_name: data.first_name } })
})

/** YALNIZ local: Telegram-sız giriş. wrangler.toml-da DEV_LOGIN_ENABLED yalnız [env.local]-dadır. */
adminRoutes.post('/auth/dev', async (c) => {
  if (c.env.DEV_LOGIN_ENABLED !== '1' || c.env.ENVIRONMENT !== 'local') return c.json({ error: 'Not found' }, 404)
  const token = await signAdminToken({ sub: 'local-dev', first_name: 'Local Admin' }, c.env.JWT_SECRET)
  return c.json({ token, admin: { id: 'local-dev', first_name: 'Local Admin' } })
})

adminRoutes.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/admin/auth/')) return next()
  return requireAdmin(c, next)
})

adminRoutes.get('/me', (c) => c.json(c.get('admin')))

adminRoutes.get('/stats', async (c) => {
  const db = c.env.DB
  const [p, ap, ot, oa, d, pd] = await db.batch<{ n: number }>([
    db.prepare('SELECT COUNT(*) AS n FROM products'),
    db.prepare('SELECT COUNT(*) AS n FROM products WHERE is_active = 1'),
    db.prepare(`SELECT COUNT(*) AS n FROM orders WHERE date(created_at, '+4 hours') = date('now', '+4 hours')`),
    db.prepare('SELECT COUNT(*) AS n FROM orders'),
    db.prepare('SELECT COUNT(*) AS n FROM devices'),
    db.prepare('SELECT COUNT(*) AS n FROM devices WHERE push_enabled = 1 AND push_token IS NOT NULL'),
  ])
  const n = (r: D1Result<{ n: number }>) => Number(r.results[0]?.n ?? 0)
  return c.json<AdminStats>({
    products: n(p),
    active_products: n(ap),
    orders_today: n(ot),
    orders_total: n(oa),
    devices: n(d),
    push_devices: n(pd),
  })
})

// ---------------------------------------------------------------------------
// Uploads (R2)
// ---------------------------------------------------------------------------

async function putImage(c: { env: AppEnv['Bindings'] }, file: File, prefix: string): Promise<string> {
  const ext = IMAGE_TYPES[file.type]
  if (!ext) badRequest('Yalnız JPG, PNG və ya WEBP')
  if (file.size > MAX_UPLOAD_BYTES) badRequest('Fayl 5 MB-dan böyük ola bilməz')
  const key = `${prefix}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
  await c.env.IMAGES_BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } })
  return key
}

async function formFile(req: { parseBody: () => Promise<Record<string, unknown>> }): Promise<File> {
  const body = await req.parseBody()
  const file = body.file
  if (!(file instanceof File)) badRequest('"file" sahəsi tələb olunur')
  return file
}

adminRoutes.post('/uploads', async (c) => {
  const key = await putImage(c, await formFile(c.req), 'uploads')
  return c.json({ key, url: imageUrl(c.env.R2_PUBLIC_URL, key) }, 201)
})

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

adminRoutes.get('/categories', async (c) => c.json(await listCategories(c.env.DB, true)))

adminRoutes.post('/categories', async (c) => {
  const b = await readJson(c.req)
  const name = reqString(b, 'name_az', 100)
  const slug = optString(b, 'slug', 100) ?? slugify(name)
  const r = await c.env.DB.prepare(
    'INSERT INTO categories (slug, name_az, name_ru, sort, is_active) VALUES (?, ?, ?, ?, ?) RETURNING id',
  )
    .bind(slug, name, optString(b, 'name_ru', 100), toInt(b.sort, 0), b.is_active === undefined ? 1 : bool(b.is_active))
    .first<{ id: number }>()
  return c.json({ id: r!.id }, 201)
})

adminRoutes.put('/categories/:id', async (c) => {
  const id = toInt(c.req.param('id'))!
  const b = await readJson(c.req)
  const name = reqString(b, 'name_az', 100)
  await c.env.DB.prepare(
    `UPDATE categories SET slug = ?, name_az = ?, name_ru = ?, sort = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?`,
  )
    .bind(optString(b, 'slug', 100) ?? slugify(name), name, optString(b, 'name_ru', 100), toInt(b.sort, 0), bool(b.is_active), id)
    .run()
  return c.json({ ok: true })
})

adminRoutes.delete('/categories/:id', async (c) => {
  const id = toInt(c.req.param('id'))!
  const used = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM products WHERE category_id = ?').bind(id).first<{ n: number }>()
  if (Number(used?.n) > 0) badRequest('Bu kateqoriyada məhsullar var — əvvəlcə onları köçürün və ya deaktiv edin')
  await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

adminRoutes.get('/products', async (c) => {
  const q = c.req.query()
  return c.json(
    await listProducts(c.env.DB, c.env.R2_PUBLIC_URL, {
      include_inactive: true,
      category: q.category || undefined,
      q: q.q || undefined,
      sort: 'name',
      page: toInt(q.page, 1),
      page_size: toInt(q.page_size, 50),
    }),
  )
})

adminRoutes.get('/products/:id', async (c) => {
  const p = await getProduct(c.env.DB, c.env.R2_PUBLIC_URL, { id: toInt(c.req.param('id'))! }, true)
  if (!p) notFound()
  return c.json(p)
})

function productFields(b: Record<string, unknown>) {
  const name = reqString(b, 'name', 200)
  const categoryId = toInt(b.category_id)
  if (!categoryId) badRequest('"category_id" tələb olunur')
  return {
    slug: optString(b, 'slug', 200) ?? slugify(name),
    category_id: categoryId,
    brand: optString(b, 'brand', 100),
    name,
    description_az: optString(b, 'description_az'),
    description_ru: optString(b, 'description_ru'),
    country: optString(b, 'country', 100),
    abv: toNum(b.abv),
    has_gift_box: bool(b.has_gift_box),
    is_featured: bool(b.is_featured),
    is_active: b.is_active === undefined ? 1 : bool(b.is_active),
    sort: toInt(b.sort, 0)!,
  }
}

adminRoutes.post('/products', async (c) => {
  const b = await readJson(c.req)
  const f = productFields(b)
  const r = await c.env.DB.prepare(
    `INSERT INTO products (slug, category_id, brand, name, description_az, description_ru, country, abv, has_gift_box, is_featured, is_active, sort)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
  )
    .bind(f.slug, f.category_id, f.brand, f.name, f.description_az, f.description_ru, f.country, f.abv, f.has_gift_box, f.is_featured, f.is_active, f.sort)
    .first<{ id: number }>()
  const id = r!.id
  // İlk variant məhsulla birlikdə göndərilə bilər
  if (Array.isArray(b.variants)) {
    for (const v of b.variants as Record<string, unknown>[]) await insertVariant(c.env.DB, id, v)
  }
  return c.json({ id }, 201)
})

adminRoutes.put('/products/:id', async (c) => {
  const id = toInt(c.req.param('id'))!
  const f = productFields(await readJson(c.req))
  await c.env.DB.prepare(
    `UPDATE products SET slug = ?, category_id = ?, brand = ?, name = ?, description_az = ?, description_ru = ?, country = ?, abv = ?,
       has_gift_box = ?, is_featured = ?, is_active = ?, sort = ?, updated_at = datetime('now') WHERE id = ?`,
  )
    .bind(f.slug, f.category_id, f.brand, f.name, f.description_az, f.description_ru, f.country, f.abv, f.has_gift_box, f.is_featured, f.is_active, f.sort, id)
    .run()
  return c.json({ ok: true })
})

adminRoutes.delete('/products/:id', async (c) => {
  const id = toInt(c.req.param('id'))!
  const { results } = await c.env.DB.prepare('SELECT r2_key FROM product_images WHERE product_id = ?').bind(id).all<{ r2_key: string }>()
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM product_images WHERE product_id = ?').bind(id),
    c.env.DB.prepare('UPDATE order_items SET product_id = NULL, variant_id = NULL WHERE product_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM product_variants WHERE product_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id),
  ])
  c.executionCtx.waitUntil(Promise.allSettled(results.filter((r) => !/^https?:/.test(r.r2_key)).map((r) => c.env.IMAGES_BUCKET.delete(r.r2_key))))
  return c.json({ ok: true })
})

// Variants
async function insertVariant(db: D1Database, productId: number, b: Record<string, unknown>) {
  const volume = toInt(b.volume_ml)
  const price = toNum(b.price)
  if (!volume || volume <= 0) badRequest('"volume_ml" tələb olunur')
  if (price === null || price < 0) badRequest('"price" tələb olunur')
  return db
    .prepare(
      `INSERT INTO product_variants (product_id, volume_ml, pack_size, price, old_price, stock, sku, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(productId, volume, toInt(b.pack_size, 1), price, toNum(b.old_price), toInt(b.stock, 0), optString(b, 'sku', 50), b.is_active === undefined ? 1 : bool(b.is_active))
    .first<{ id: number }>()
}

adminRoutes.post('/products/:id/variants', async (c) => {
  const r = await insertVariant(c.env.DB, toInt(c.req.param('id'))!, await readJson(c.req))
  return c.json({ id: r!.id }, 201)
})

adminRoutes.put('/variants/:id', async (c) => {
  const b = await readJson(c.req)
  const volume = toInt(b.volume_ml)
  const price = toNum(b.price)
  if (!volume || price === null) badRequest('"volume_ml" və "price" tələb olunur')
  await c.env.DB.prepare(
    `UPDATE product_variants SET volume_ml = ?, pack_size = ?, price = ?, old_price = ?, stock = ?, sku = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?`,
  )
    .bind(volume, toInt(b.pack_size, 1), price, toNum(b.old_price), toInt(b.stock, 0), optString(b, 'sku', 50), bool(b.is_active), toInt(c.req.param('id')))
    .run()
  return c.json({ ok: true })
})

adminRoutes.delete('/variants/:id', async (c) => {
  const id = toInt(c.req.param('id'))
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE order_items SET variant_id = NULL WHERE variant_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM product_variants WHERE id = ?').bind(id),
  ])
  return c.json({ ok: true })
})

// Images
adminRoutes.post('/products/:id/images', async (c) => {
  const productId = toInt(c.req.param('id'))!
  const key = await putImage(c, await formFile(c.req), `products/${productId}`)
  const max = await c.env.DB.prepare('SELECT COALESCE(MAX(sort), -1) AS s FROM product_images WHERE product_id = ?').bind(productId).first<{ s: number }>()
  const r = await c.env.DB.prepare('INSERT INTO product_images (product_id, r2_key, sort) VALUES (?, ?, ?) RETURNING id')
    .bind(productId, key, Number(max?.s ?? -1) + 1)
    .first<{ id: number }>()
  return c.json({ id: r!.id, url: imageUrl(c.env.R2_PUBLIC_URL, key) }, 201)
})

/** Şəkli əsas (birinci) et */
adminRoutes.post('/images/:id/primary', async (c) => {
  const id = toInt(c.req.param('id'))
  const img = await c.env.DB.prepare('SELECT product_id FROM product_images WHERE id = ?').bind(id).first<{ product_id: number }>()
  if (!img) notFound()
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE product_images SET sort = sort + 1 WHERE product_id = ?').bind(img.product_id),
    c.env.DB.prepare('UPDATE product_images SET sort = 0 WHERE id = ?').bind(id),
  ])
  return c.json({ ok: true })
})

adminRoutes.delete('/images/:id', async (c) => {
  const id = toInt(c.req.param('id'))
  const img = await c.env.DB.prepare('SELECT r2_key FROM product_images WHERE id = ?').bind(id).first<{ r2_key: string }>()
  if (!img) notFound()
  await c.env.DB.prepare('DELETE FROM product_images WHERE id = ?').bind(id).run()
  if (!/^https?:/.test(img.r2_key)) c.executionCtx.waitUntil(c.env.IMAGES_BUCKET.delete(img.r2_key))
  return c.json({ ok: true })
})

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

adminRoutes.get('/banners', async (c) => c.json(await listBanners(c.env.DB, c.env.R2_PUBLIC_URL, true)))

function bannerFields(b: Record<string, unknown>) {
  return {
    kicker: optString(b, 'kicker', 40),
    title: reqString(b, 'title', 120),
    subtitle: optString(b, 'subtitle', 200),
    image_key: optString(b, 'image_key', 300),
    link: optString(b, 'link', 300),
    sort: toInt(b.sort, 0),
    starts_at: optString(b, 'starts_at', 30),
    ends_at: optString(b, 'ends_at', 30),
    is_active: b.is_active === undefined ? 1 : bool(b.is_active),
  }
}

adminRoutes.post('/banners', async (c) => {
  const f = bannerFields(await readJson(c.req))
  const r = await c.env.DB.prepare(
    'INSERT INTO banners (kicker, title, subtitle, image_key, link, sort, starts_at, ends_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *',
  )
    .bind(f.kicker, f.title, f.subtitle, f.image_key, f.link, f.sort, f.starts_at, f.ends_at, f.is_active)
    .first()
  return c.json(mapBanner(r!, c.env.R2_PUBLIC_URL), 201)
})

adminRoutes.put('/banners/:id', async (c) => {
  const f = bannerFields(await readJson(c.req))
  await c.env.DB.prepare(
    `UPDATE banners SET kicker = ?, title = ?, subtitle = ?, image_key = ?, link = ?, sort = ?, starts_at = ?, ends_at = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?`,
  )
    .bind(f.kicker, f.title, f.subtitle, f.image_key, f.link, f.sort, f.starts_at, f.ends_at, f.is_active, toInt(c.req.param('id')))
    .run()
  return c.json({ ok: true })
})

adminRoutes.delete('/banners/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM banners WHERE id = ?').bind(toInt(c.req.param('id'))).run()
  return c.json({ ok: true })
})

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

adminRoutes.get('/settings', async (c) => c.json(await getSettings(c.env.DB)))
adminRoutes.put('/settings', async (c) => c.json(await updateSettings(c.env.DB, await readJson(c.req))))

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const STATUSES: OrderStatus[] = ['new', 'confirmed', 'delivered', 'cancelled']

adminRoutes.get('/orders', async (c) => {
  const q = c.req.query()
  const status = q.status && STATUSES.includes(q.status as OrderStatus) ? q.status : undefined
  return c.json(await listOrders(c.env.DB, { status, page: toInt(q.page, 1), page_size: toInt(q.page_size, 30) }))
})

adminRoutes.patch('/orders/:id', async (c) => {
  const id = toInt(c.req.param('id'))!
  const b = await readJson(c.req)
  if (!STATUSES.includes(b.status as OrderStatus)) badRequest('Yanlış status')
  await c.env.DB.prepare(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`).bind(b.status, id).run()
  const order = await getOrder(c.env.DB, id)
  if (!order) notFound()
  return c.json(order)
})

// ---------------------------------------------------------------------------
// Push notifications
// ---------------------------------------------------------------------------

adminRoutes.get('/notifications', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM notification_logs ORDER BY id DESC LIMIT 100').all()
  return c.json(results)
})

adminRoutes.post('/notifications', async (c) => {
  const b = await readJson(c.req)
  const title = reqString(b, 'title', 80)
  const body = reqString(b, 'body', 240)
  const link = optString(b, 'link', 300)
  const deviceId = optString(b, 'device_id', 100)
  const target = deviceId ? `device:${deviceId}` : 'all'

  const stmt = deviceId
    ? c.env.DB.prepare('SELECT push_token FROM devices WHERE device_id = ? AND push_token IS NOT NULL').bind(deviceId)
    : c.env.DB.prepare('SELECT push_token FROM devices WHERE push_enabled = 1 AND push_token IS NOT NULL')
  const { results } = await stmt.all<{ push_token: string }>()
  const tokens = results.map((r) => r.push_token)
  if (!tokens.length) badRequest(deviceId ? 'Bu cihazın push tokeni yoxdur' : 'Push tokeni olan cihaz yoxdur')

  const res = await sendPush(tokens, { title, body, data: link ? { link } : {} }, c.env.EXPO_ACCESS_TOKEN)
  const stmts: D1PreparedStatement[] = [
    c.env.DB.prepare(
      'INSERT INTO notification_logs (title, body, link, target, sent_count, failed_count, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).bind(title, body, link, target, res.sent, res.failed, c.get('admin').username ?? c.get('admin').sub),
    ...res.deadTokens.map((t) => c.env.DB.prepare('UPDATE devices SET push_token = NULL WHERE push_token = ?').bind(t)),
  ]
  await c.env.DB.batch(stmts)
  return c.json({ sent: res.sent, failed: res.failed, removed: res.deadTokens.length })
})

adminRoutes.get('/devices', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT device_id, platform, app_version, locale, push_enabled, (push_token IS NOT NULL) AS has_token, last_seen_at FROM devices ORDER BY last_seen_at DESC LIMIT 200',
  ).all()
  return c.json(results)
})

// Home preview (admin panelin əsas səhifəsi üçün)
adminRoutes.get('/overview', async (c) => {
  const [settings, orders] = await Promise.all([getSettings(c.env.DB), listOrders(c.env.DB, { page_size: 5 })])
  return c.json({ settings, recent_orders: orders.items })
})
