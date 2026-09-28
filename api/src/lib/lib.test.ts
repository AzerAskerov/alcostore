import { describe, expect, it } from 'vitest'
import type { ProductVariant } from '@alcostore/shared'
import { pickDisplayVariant } from '../services/catalog'
import { orderCode, validateOrderInput } from '../services/orders'
import { signAdminToken, verifyAdminToken } from './auth'
import { isExpoPushToken } from './expo-push'
import { verifyTelegramAuth, type TelegramAuthData } from './telegram'

async function signTelegram(data: Omit<TelegramAuthData, 'hash'>, botToken: string): Promise<string> {
  const check = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n')
  const enc = new TextEncoder()
  const secret = await crypto.subtle.digest('SHA-256', enc.encode(botToken))
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(check))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

describe('verifyTelegramAuth', () => {
  const bot = '123456:TEST-TOKEN'
  const base = { id: '42', first_name: 'Azer', username: 'azer', auth_date: '1700000000' }

  it('düzgün imzanı qəbul edir', async () => {
    const hash = await signTelegram(base, bot)
    expect(await verifyTelegramAuth({ ...base, hash }, bot)).toBe(true)
  })
  it('dəyişdirilmiş məlumatı rədd edir', async () => {
    const hash = await signTelegram(base, bot)
    expect(await verifyTelegramAuth({ ...base, id: '43', hash }, bot)).toBe(false)
  })
  it('başqa bot tokeni ilə rədd edir', async () => {
    const hash = await signTelegram(base, bot)
    expect(await verifyTelegramAuth({ ...base, hash }, '999:OTHER')).toBe(false)
  })
})

describe('admin JWT', () => {
  it('imzalanır və yoxlanılır', async () => {
    const t = await signAdminToken({ sub: '42', username: 'azer' }, 'secret')
    expect((await verifyAdminToken(t, 'secret'))?.sub).toBe('42')
    expect(await verifyAdminToken(t, 'wrong')).toBeNull()
  })
})

describe('validateOrderInput', () => {
  it('eyni variantları birləşdirir', () => {
    const r = validateOrderInput({
      source: 'ios',
      items: [
        { variant_id: 1, qty: 1 },
        { variant_id: 1, qty: 2 },
        { variant_id: 5, qty: 1 },
      ],
    })
    expect(r.items).toEqual([
      { variant_id: 1, qty: 3 },
      { variant_id: 5, qty: 1 },
    ])
  })
  it('boş səbəti və yanlış mənbəni rədd edir', () => {
    expect(() => validateOrderInput({ source: 'ios', items: [] })).toThrow()
    expect(() => validateOrderInput({ source: 'fax', items: [{ variant_id: 1, qty: 1 }] })).toThrow()
    expect(() => validateOrderInput({ source: 'web', items: [{ variant_id: 1, qty: 0 }] })).toThrow()
  })
  it('sifariş kodu', () => {
    expect(orderCode(1)).toBe('AS-1001')
  })
})

describe('pickDisplayVariant', () => {
  const v = (id: number, price: number, stock: number, is_active = true): ProductVariant => ({
    id, product_id: 1, volume_ml: 700, pack_size: 1, price, old_price: null, stock, sku: null, is_active,
  })
  it('stokda olan ən ucuzu seçir', () => {
    expect(pickDisplayVariant([v(1, 69, 0), v(2, 89, 5), v(3, 119, 2)])?.id).toBe(2)
  })
  it('hamısı bitibsə ən ucuzu', () => {
    expect(pickDisplayVariant([v(1, 69, 0), v(2, 89, 0)])?.id).toBe(1)
  })
  it('aktiv variant yoxdursa null', () => {
    expect(pickDisplayVariant([v(1, 69, 3, false)])).toBeNull()
  })
})

describe('isExpoPushToken', () => {
  it('formatı yoxlayır', () => {
    expect(isExpoPushToken('ExponentPushToken[abc]')).toBe(true)
    expect(isExpoPushToken('abc')).toBe(false)
  })
})
