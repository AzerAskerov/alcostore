import {
  buildOrderMessage,
  cartTotals,
  formatPrice,
  formatVolume,
  whatsappUrl,
  type CreateOrderInput,
  type CreateOrderResult,
  type Order,
  type OrderItem,
  type OrderSource,
  type StoreSettings,
} from '@alcostore/shared'
import { badRequest } from '../lib/http'
import { escapeHtml } from '../lib/telegram'

const SOURCES: OrderSource[] = ['ios', 'android', 'web']
const MAX_LINES = 30
const MAX_QTY = 50

export function orderCode(id: number): string {
  return `AS-${1000 + id}`
}

export function validateOrderInput(body: Record<string, unknown>): CreateOrderInput {
  const source = body.source as OrderSource
  if (!SOURCES.includes(source)) badRequest('"source" ios | android | web olmalıdır')
  const items = body.items
  if (!Array.isArray(items) || items.length === 0) badRequest('Səbət boşdur')
  if (items.length > MAX_LINES) badRequest('Səbətdə çox məhsul var')
  const merged = new Map<number, number>()
  for (const it of items as Record<string, unknown>[]) {
    const vid = Number(it?.variant_id)
    const qty = Number(it?.qty)
    if (!Number.isInteger(vid) || vid <= 0) badRequest('Yanlış variant_id')
    if (!Number.isInteger(qty) || qty <= 0 || qty > MAX_QTY) badRequest('Yanlış miqdar')
    merged.set(vid, Math.min(MAX_QTY, (merged.get(vid) ?? 0) + qty))
  }
  const note = typeof body.note === 'string' ? body.note.slice(0, 500) : undefined
  const device_id = typeof body.device_id === 'string' ? body.device_id.slice(0, 100) : undefined
  return { source, note, device_id, items: [...merged].map(([variant_id, qty]) => ({ variant_id, qty })) }
}

interface PricedLine {
  product_id: number
  variant_id: number
  name: string
  volume_ml: number
  pack_size: number
  unit_price: number
  qty: number
}

/** Qiyməti klientdən yox, bazadan götürürük. */
async function priceLines(db: D1Database, input: CreateOrderInput): Promise<PricedLine[]> {
  const ids = input.items.map((i) => i.variant_id)
  const { results } = await db
    .prepare(
      `SELECT v.id, v.product_id, v.volume_ml, v.pack_size, v.price, v.stock, v.is_active, p.name, p.is_active AS p_active
       FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE v.id IN (${ids.map(() => '?').join(',')})`,
    )
    .bind(...ids)
    .all()
  const byId = new Map(results.map((r) => [Number(r.id), r]))
  return input.items.map((it) => {
    const r = byId.get(it.variant_id)
    if (!r || !r.is_active || !r.p_active) badRequest('Səbətdəki bəzi məhsullar artıq mövcud deyil')
    if (Number(r.stock) <= 0) badRequest(`"${r.name}" hazırda stokda yoxdur`)
    return {
      product_id: Number(r.product_id),
      variant_id: it.variant_id,
      name: String(r.name),
      volume_ml: Number(r.volume_ml),
      pack_size: Number(r.pack_size),
      unit_price: Number(r.price),
      qty: it.qty,
    }
  })
}

export async function createOrder(
  db: D1Database,
  settings: StoreSettings,
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const lines = await priceLines(db, input)
  const totals = cartTotals(lines, settings)
  if (totals.below_min_by > 0) badRequest(`Minimum sifariş məbləği ${formatPrice(settings.min_order)}-dir`)

  const inserted = await db
    .prepare(
      `INSERT INTO orders (device_id, source, subtotal, delivery_fee, total, note) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(input.device_id ?? null, input.source, totals.subtotal, totals.delivery_fee, totals.total, input.note ?? null)
    .first<{ id: number }>()
  const id = Number(inserted!.id)
  const code = orderCode(id)

  await db.batch([
    db.prepare('UPDATE orders SET code = ? WHERE id = ?').bind(code, id),
    ...lines.map((l) =>
      db
        .prepare(
          `INSERT INTO order_items (order_id, product_id, variant_id, name, volume_ml, pack_size, unit_price, qty, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(id, l.product_id, l.variant_id, l.name, l.volume_ml, l.pack_size, l.unit_price, l.qty, Math.round(l.unit_price * l.qty * 100) / 100),
    ),
  ])

  const order = (await getOrder(db, id))!
  const message = buildOrderMessage({
    storeName: settings.store_name,
    lines,
    subtotal: totals.subtotal,
    deliveryFee: totals.delivery_fee,
    total: totals.total,
    orderCode: code,
    note: input.note,
  })
  return { order, message, whatsapp_url: whatsappUrl(settings.whatsapp_number, message) }
}

function mapOrder(r: Record<string, unknown>, items: OrderItem[]): Order {
  return {
    id: Number(r.id),
    code: String(r.code ?? orderCode(Number(r.id))),
    device_id: (r.device_id as string) ?? null,
    source: r.source as OrderSource,
    status: r.status as Order['status'],
    subtotal: Number(r.subtotal),
    delivery_fee: Number(r.delivery_fee),
    total: Number(r.total),
    note: (r.note as string) ?? null,
    items,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  }
}

function mapItem(r: Record<string, unknown>): OrderItem {
  return {
    id: Number(r.id),
    order_id: Number(r.order_id),
    product_id: r.product_id === null ? null : Number(r.product_id),
    variant_id: r.variant_id === null ? null : Number(r.variant_id),
    name: String(r.name),
    volume_ml: Number(r.volume_ml),
    pack_size: Number(r.pack_size),
    unit_price: Number(r.unit_price),
    qty: Number(r.qty),
    line_total: Number(r.line_total),
  }
}

export async function getOrder(db: D1Database, id: number): Promise<Order | null> {
  const r = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first()
  if (!r) return null
  const { results } = await db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').bind(id).all()
  return mapOrder(r, results.map(mapItem))
}

export async function listOrders(
  db: D1Database,
  opts: { status?: string; page?: number; page_size?: number },
): Promise<{ items: Order[]; total: number; page: number; page_size: number }> {
  const page = Math.max(1, opts.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, opts.page_size ?? 30))
  const where = opts.status ? 'WHERE status = ?' : ''
  const args = opts.status ? [opts.status] : []
  const [count, rows] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS n FROM orders ${where}`).bind(...args).first<{ n: number }>(),
    db
      .prepare(`SELECT * FROM orders ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
      .bind(...args, pageSize, (page - 1) * pageSize)
      .all(),
  ])
  const ids = rows.results.map((r) => Number(r.id))
  const itemsBy = new Map<number, OrderItem[]>()
  if (ids.length) {
    const { results } = await db
      .prepare(`SELECT * FROM order_items WHERE order_id IN (${ids.map(() => '?').join(',')}) ORDER BY id`)
      .bind(...ids)
      .all()
    for (const r of results) {
      const it = mapItem(r)
      itemsBy.set(it.order_id, [...(itemsBy.get(it.order_id) ?? []), it])
    }
  }
  return {
    items: rows.results.map((r) => mapOrder(r, itemsBy.get(Number(r.id)) ?? [])),
    total: Number(count?.n ?? 0),
    page,
    page_size: pageSize,
  }
}

export function orderTelegramHtml(order: Order, adminUrl: string): string {
  const rows = order.items
    .map((i) => {
      const vol = i.pack_size > 1 ? `(${formatVolume(i.volume_ml, i.pack_size)})` : formatVolume(i.volume_ml)
      return `• ${escapeHtml(i.name)} ${vol} × ${i.qty} — ${formatPrice(i.line_total)}`
    })
    .join('\n')
  const src = { ios: 'iOS', android: 'Android', web: 'Veb' }[order.source]
  return [
    `🛒 <b>Yeni sifariş ${order.code}</b> (${src})`,
    '',
    rows,
    '',
    order.delivery_fee > 0 ? `Çatdırılma: ${formatPrice(order.delivery_fee)}` : 'Çatdırılma: pulsuz',
    `<b>Cəmi: ${formatPrice(order.total)}</b>`,
    order.note ? `Qeyd: ${escapeHtml(order.note)}` : '',
    '',
    `Müştəri WhatsApp-a yönləndirildi. <a href="${adminUrl}/admin/orders">Admin panel</a>`,
  ]
    .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
    .join('\n')
}
