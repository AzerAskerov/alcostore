import { describe, expect, it } from 'vitest'
import {
  buildOrderMessage,
  cartTotals,
  discountPercent,
  formatPrice,
  formatVolume,
  isStoreOpen,
  slugify,
  whatsappUrl,
} from './index'

describe('formatPrice', () => {
  it('dizayndakı formatı verir', () => {
    expect(formatPrice(89)).toBe('89,00 ₼')
    expect(formatPrice(18.5)).toBe('18,50 ₼')
    expect(formatPrice(1234.5)).toBe('1 234,50 ₼')
  })
})

describe('formatVolume', () => {
  it('litr, ml və paket', () => {
    expect(formatVolume(700)).toBe('0.7 L')
    expect(formatVolume(750)).toBe('0.75 L')
    expect(formatVolume(1000)).toBe('1 L')
    expect(formatVolume(330, 6)).toBe('6 × 0.33 L')
    expect(formatVolume(50)).toBe('50 ml')
  })
})

describe('slugify', () => {
  it('Azərbaycan hərflərini çevirir', () => {
    expect(slugify('Şərab')).toBe('serab')
    expect(slugify('Pivə')).toBe('pive')
    expect(slugify('Jack Daniel’s Old No.7')).toBe('jack-daniel-s-old-no-7')
    expect(slugify('Moët Impérial')).toBe('moet-imperial')
  })
})

describe('cartTotals', () => {
  const s = { free_delivery_min: 50, delivery_fee: 5, min_order: 20 }
  it('pulsuz çatdırılma həddi', () => {
    expect(cartTotals([{ unit_price: 89, qty: 1 }], s)).toMatchObject({ subtotal: 89, delivery_fee: 0, total: 89 })
    expect(cartTotals([{ unit_price: 18.5, qty: 2 }], s)).toMatchObject({ subtotal: 37, delivery_fee: 5, total: 42 })
  })
  it('minimum sifariş', () => {
    expect(cartTotals([{ unit_price: 10, qty: 1 }], s).below_min_by).toBe(10)
    expect(cartTotals([], s)).toMatchObject({ total: 0, delivery_fee: 0, below_min_by: 0 })
  })
})

describe('whatsapp', () => {
  it('dizayndakı mətn', () => {
    const msg = buildOrderMessage({
      storeName: 'Alco Store',
      lines: [
        { name: 'Chivas Regal 12', volume_ml: 700, pack_size: 1, qty: 1, unit_price: 89 },
        { name: 'Savalan Merlot', volume_ml: 750, pack_size: 1, qty: 2, unit_price: 18.5 },
        { name: 'Corona Extra', volume_ml: 330, pack_size: 6, qty: 1, unit_price: 21 },
      ],
      subtotal: 147,
      deliveryFee: 0,
      total: 147,
    })
    expect(msg).toContain('• Corona Extra (6 × 0.33 L) × 1 — 21,00 ₼')
    expect(msg).toContain('Salam, Alco Store sifarişi:')
    expect(msg).toContain('• Chivas Regal 12 0.7 L × 1 — 89,00 ₼')
    expect(msg).toContain('• Savalan Merlot 0.75 L × 2 — 37,00 ₼')
    expect(msg).toContain('Cəmi: 147,00 ₼')
    expect(msg.endsWith('Ünvan: ____')).toBe(true)
  })
  it('wa.me linki', () => {
    expect(whatsappUrl('+994 50 000 00 00', 'a b')).toBe('https://wa.me/994500000000?text=a%20b')
  })
})

describe('isStoreOpen', () => {
  it('Bakı vaxtı ilə', () => {
    // 08:00 UTC = 12:00 Bakı
    expect(isStoreOpen('10:00', '23:00', new Date('2026-01-01T08:00:00Z'))).toBe(true)
    // 20:00 UTC = 00:00 Bakı
    expect(isStoreOpen('10:00', '23:00', new Date('2026-01-01T20:00:00Z'))).toBe(false)
    // gecəni keçən: 21:00 UTC = 01:00 Bakı
    expect(isStoreOpen('18:00', '02:00', new Date('2026-01-01T21:00:00Z'))).toBe(true)
  })
})

describe('discountPercent', () => {
  it('hesablayır', () => {
    expect(discountPercent(89, 104)).toBe(14)
    expect(discountPercent(89, null)).toBeNull()
  })
})
