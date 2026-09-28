import type {
  Banner,
  Category,
  Paginated,
  Product,
  ProductFacets,
  ProductImage,
  ProductQuery,
  ProductSummary,
  ProductVariant,
} from '@alcostore/shared'

type Row = Record<string, unknown>

export function imageUrl(publicBase: string, key: string | null | undefined): string | null {
  if (!key) return null
  if (/^https?:\/\//.test(key)) return key
  return `${publicBase.replace(/\/$/, '')}/${key}`
}

export function mapCategory(r: Row): Category {
  return {
    id: Number(r.id),
    slug: String(r.slug),
    name_az: String(r.name_az),
    name_ru: (r.name_ru as string) ?? null,
    sort: Number(r.sort),
    is_active: Boolean(r.is_active),
    ...(r.product_count !== undefined ? { product_count: Number(r.product_count) } : {}),
  }
}

export function mapVariant(r: Row): ProductVariant {
  return {
    id: Number(r.id),
    product_id: Number(r.product_id),
    volume_ml: Number(r.volume_ml),
    pack_size: Number(r.pack_size),
    price: Number(r.price),
    old_price: r.old_price === null || r.old_price === undefined ? null : Number(r.old_price),
    stock: Number(r.stock),
    sku: (r.sku as string) ?? null,
    is_active: Boolean(r.is_active),
  }
}

export function mapBanner(r: Row, publicBase: string): Banner {
  return {
    id: Number(r.id),
    kicker: (r.kicker as string) ?? null,
    title: String(r.title),
    subtitle: (r.subtitle as string) ?? null,
    image_url: imageUrl(publicBase, r.image_key as string),
    link: (r.link as string) ?? null,
    sort: Number(r.sort),
    starts_at: (r.starts_at as string) ?? null,
    ends_at: (r.ends_at as string) ?? null,
    is_active: Boolean(r.is_active),
  }
}

/** Siyahıda göstəriləcək variant: stokda olan ən ucuz; hamısı bitibsə ən ucuz. */
export function pickDisplayVariant(variants: ProductVariant[]): ProductVariant | null {
  const active = variants.filter((v) => v.is_active)
  if (!active.length) return null
  const inStock = active.filter((v) => v.stock > 0)
  const pool = inStock.length ? inStock : active
  return [...pool].sort((a, b) => a.price - b.price)[0]
}

export async function listCategories(db: D1Database, includeInactive = false): Promise<Category[]> {
  const { results } = await db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS product_count
       FROM categories c ${includeInactive ? '' : 'WHERE c.is_active = 1'} ORDER BY c.sort, c.id`,
    )
    .all()
  return results.map(mapCategory)
}

async function variantsFor(db: D1Database, productIds: number[], includeInactive: boolean) {
  const map = new Map<number, ProductVariant[]>()
  if (!productIds.length) return map
  const ph = productIds.map(() => '?').join(',')
  const { results } = await db
    .prepare(
      `SELECT * FROM product_variants WHERE product_id IN (${ph}) ${includeInactive ? '' : 'AND is_active = 1'}
       ORDER BY volume_ml, pack_size`,
    )
    .bind(...productIds)
    .all()
  for (const r of results) {
    const v = mapVariant(r)
    map.set(v.product_id, [...(map.get(v.product_id) ?? []), v])
  }
  return map
}

async function imagesFor(db: D1Database, productIds: number[], publicBase: string) {
  const map = new Map<number, ProductImage[]>()
  if (!productIds.length) return map
  const ph = productIds.map(() => '?').join(',')
  const { results } = await db
    .prepare(`SELECT * FROM product_images WHERE product_id IN (${ph}) ORDER BY sort, id`)
    .bind(...productIds)
    .all()
  for (const r of results) {
    const img: ProductImage = {
      id: Number(r.id),
      product_id: Number(r.product_id),
      url: imageUrl(publicBase, r.r2_key as string)!,
      sort: Number(r.sort),
    }
    map.set(img.product_id, [...(map.get(img.product_id) ?? []), img])
  }
  return map
}

const SORT_SQL: Record<string, string> = {
  popular: 'p.is_featured DESC, p.sort, p.id',
  price_asc: 'min_price ASC, p.id',
  price_desc: 'min_price DESC, p.id',
  name: 'p.name COLLATE NOCASE ASC',
  new: 'p.created_at DESC, p.id DESC',
}

export async function listProducts(
  db: D1Database,
  publicBase: string,
  q: ProductQuery & { include_inactive?: boolean },
): Promise<Paginated<ProductSummary>> {
  const where: string[] = []
  const args: unknown[] = []
  if (!q.include_inactive) where.push('p.is_active = 1', 'c.is_active = 1')
  if (q.category) {
    where.push('c.slug = ?')
    args.push(q.category)
  }
  if (q.country) {
    where.push('p.country = ?')
    args.push(q.country)
  }
  if (q.featured) where.push('p.is_featured = 1')
  if (q.volume_ml) {
    where.push('EXISTS (SELECT 1 FROM product_variants v2 WHERE v2.product_id = p.id AND v2.is_active = 1 AND v2.volume_ml = ?)')
    args.push(q.volume_ml)
  }
  if (q.q?.trim()) {
    // SQLite-ın lower()/LIKE yalnız ASCII üçün registrdən asılı deyil. "şotlandiya" ↔ "Şotlandiya"
    // üçün həm yazıldığı kimi, həm də baş hərfi böyük variantı yoxlayırıq.
    const raw = q.q.trim()
    const cap = raw.charAt(0).toLocaleUpperCase('az') + raw.slice(1)
    const terms = [...new Set([raw.toLowerCase(), raw, cap])].map((t) => `%${t}%`)
    const cols = ['p.name', "IFNULL(p.brand, '')", "IFNULL(p.country, '')", 'c.name_az']
    where.push(`(${terms.flatMap(() => cols.map((col) => `${col} LIKE ?`)).join(' OR ')})`)
    for (const t of terms) args.push(...cols.map(() => t))
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const page = Math.max(1, q.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, q.page_size ?? 24))
  const order = SORT_SQL[q.sort ?? 'popular'] ?? SORT_SQL.popular

  const base = `FROM products p JOIN categories c ON c.id = p.category_id ${whereSql}`
  const [countRow, rows] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS n ${base}`).bind(...args).first<{ n: number }>(),
    db
      .prepare(
        `SELECT p.*, c.slug AS category_slug, c.name_az AS category_name,
          (SELECT MIN(v.price) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1) AS min_price,
          (SELECT pi.r2_key FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort, pi.id LIMIT 1) AS image_key
         ${base} ORDER BY ${order} LIMIT ? OFFSET ?`,
      )
      .bind(...args, pageSize, (page - 1) * pageSize)
      .all(),
  ])

  const ids = rows.results.map((r) => Number(r.id))
  const variants = await variantsFor(db, ids, false)
  const items: ProductSummary[] = rows.results.map((r) => {
    const vs = variants.get(Number(r.id)) ?? []
    return {
      id: Number(r.id),
      slug: String(r.slug),
      name: String(r.name),
      brand: (r.brand as string) ?? null,
      country: (r.country as string) ?? null,
      category_slug: String(r.category_slug),
      category_name: String(r.category_name),
      image_url: imageUrl(publicBase, r.image_key as string),
      variant: pickDisplayVariant(vs),
      variant_count: vs.length,
      is_featured: Boolean(r.is_featured),
    }
  })
  return { items, total: Number(countRow?.n ?? 0), page, page_size: pageSize }
}

export async function getProduct(
  db: D1Database,
  publicBase: string,
  by: { slug?: string; id?: number },
  includeInactive = false,
): Promise<Product | null> {
  const cond = by.id !== undefined ? 'p.id = ?' : 'p.slug = ?'
  const r = await db
    .prepare(
      `SELECT p.*, c.slug AS category_slug, c.name_az AS category_name
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE ${cond} ${includeInactive ? '' : 'AND p.is_active = 1'}`,
    )
    .bind(by.id ?? by.slug)
    .first()
  if (!r) return null
  const id = Number(r.id)
  const [variants, images] = await Promise.all([
    variantsFor(db, [id], includeInactive),
    imagesFor(db, [id], publicBase),
  ])
  return {
    id,
    slug: String(r.slug),
    category_id: Number(r.category_id),
    category_slug: String(r.category_slug),
    category_name: String(r.category_name),
    brand: (r.brand as string) ?? null,
    name: String(r.name),
    description_az: (r.description_az as string) ?? null,
    description_ru: (r.description_ru as string) ?? null,
    country: (r.country as string) ?? null,
    abv: r.abv === null || r.abv === undefined ? null : Number(r.abv),
    has_gift_box: Boolean(r.has_gift_box),
    is_featured: Boolean(r.is_featured),
    is_active: Boolean(r.is_active),
    sort: Number(r.sort),
    variants: variants.get(id) ?? [],
    images: images.get(id) ?? [],
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  }
}

export async function getFacets(db: D1Database, category?: string): Promise<ProductFacets> {
  const join = 'FROM products p JOIN categories c ON c.id = p.category_id WHERE p.is_active = 1'
  const catSql = category ? ' AND c.slug = ?' : ''
  const args = category ? [category] : []
  const [countries, volumes] = await Promise.all([
    db
      .prepare(`SELECT DISTINCT p.country AS v ${join}${catSql} AND p.country IS NOT NULL ORDER BY p.country`)
      .bind(...args)
      .all(),
    db
      .prepare(
        `SELECT DISTINCT v.volume_ml AS v FROM product_variants v JOIN products p ON p.id = v.product_id
         JOIN categories c ON c.id = p.category_id WHERE p.is_active = 1 AND v.is_active = 1${catSql} ORDER BY v.volume_ml`,
      )
      .bind(...args)
      .all(),
  ])
  return {
    countries: countries.results.map((r) => String(r.v)),
    volumes: volumes.results.map((r) => Number(r.v)),
  }
}

export async function listBanners(db: D1Database, publicBase: string, includeInactive = false): Promise<Banner[]> {
  const cond = includeInactive
    ? ''
    : `WHERE is_active = 1 AND (starts_at IS NULL OR starts_at <= datetime('now')) AND (ends_at IS NULL OR ends_at > datetime('now'))`
  const { results } = await db.prepare(`SELECT * FROM banners ${cond} ORDER BY sort, id`).all()
  return results.map((r) => mapBanner(r, publicBase))
}
