import type { StoreSettings } from './types'

export interface CartTotals {
  subtotal: number
  delivery_fee: number
  total: number
  item_count: number
  /** Minimum sifariş məbləğinə çatmayıbsa, nə qədər çatmır */
  below_min_by: number
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function cartTotals(
  lines: { unit_price: number; qty: number }[],
  settings: Pick<StoreSettings, 'free_delivery_min' | 'delivery_fee' | 'min_order'>,
): CartTotals {
  const subtotal = round2(lines.reduce((s, l) => s + l.unit_price * l.qty, 0))
  const item_count = lines.reduce((s, l) => s + l.qty, 0)
  const free = settings.free_delivery_min <= 0 || subtotal >= settings.free_delivery_min
  const delivery_fee = subtotal === 0 || free ? 0 : settings.delivery_fee
  return {
    subtotal,
    delivery_fee,
    total: round2(subtotal + delivery_fee),
    item_count,
    below_min_by: subtotal > 0 && subtotal < settings.min_order ? round2(settings.min_order - subtotal) : 0,
  }
}
