import type { StoreSettings } from '@alcostore/shared'

export const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'Alco Store',
  tagline: 'Şərab evi · Bakı',
  whatsapp_number: '+994 50 000 00 00',
  phone: '+994 50 000 00 00',
  open_from: '10:00',
  open_to: '23:00',
  delivery_area: 'Bakı',
  delivery_text: 'Bakı daxili, 1 saat ərzində',
  free_delivery_min: 50,
  delivery_fee: 5,
  min_order: 15,
  support_email: 'info@alcostorebaku.az',
  address: 'Bakı, Azərbaycan',
  instagram: 'https://www.instagram.com/alcostore.baku/',
}

const NUMERIC: (keyof StoreSettings)[] = ['free_delivery_min', 'delivery_fee', 'min_order']

export async function getSettings(db: D1Database): Promise<StoreSettings> {
  const { results } = await db.prepare('SELECT key, value FROM store_settings').all<{ key: string; value: string }>()
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS }
  for (const { key, value } of results) {
    if (!(key in DEFAULT_SETTINGS)) continue
    out[key] = NUMERIC.includes(key as keyof StoreSettings) ? Number(value) : value
  }
  return out as unknown as StoreSettings
}

export async function updateSettings(db: D1Database, patch: Record<string, unknown>): Promise<StoreSettings> {
  const stmts: D1PreparedStatement[] = []
  for (const [key, raw] of Object.entries(patch)) {
    if (!(key in DEFAULT_SETTINGS)) continue
    const isNum = NUMERIC.includes(key as keyof StoreSettings)
    if (isNum && !Number.isFinite(Number(raw))) continue
    if (!isNum && typeof raw !== 'string') continue
    if (key === 'open_from' || key === 'open_to') {
      if (!/^\d{2}:\d{2}$/.test(String(raw))) continue
    }
    stmts.push(
      db
        .prepare(
          `INSERT INTO store_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        )
        .bind(key, String(raw).trim()),
    )
  }
  if (stmts.length) await db.batch(stmts)
  return getSettings(db)
}
