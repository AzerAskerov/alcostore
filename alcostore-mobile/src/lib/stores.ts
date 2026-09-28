import * as Crypto from 'expo-crypto'
import type { CartLine, ProductSummary } from '@alcostore/shared'
import { createPersistentStore } from './persistent-store'

const MAX_QTY = 50

// ---------------------------------------------------------------- Səbət
export const cartStore = createPersistentStore<CartLine[]>('alcostore.cart.v1', [])

export const cart = {
  add(line: Omit<CartLine, 'qty'>, qty = 1) {
    cartStore.set((prev) => {
      const i = prev.findIndex((l) => l.variant_id === line.variant_id)
      if (i === -1) return [...prev, { ...line, qty: Math.min(MAX_QTY, qty) }]
      const next = [...prev]
      next[i] = { ...next[i], ...line, qty: Math.min(MAX_QTY, next[i].qty + qty) }
      return next
    })
  },
  setQty(variantId: number, qty: number) {
    cartStore.set((prev) =>
      qty <= 0
        ? prev.filter((l) => l.variant_id !== variantId)
        : prev.map((l) => (l.variant_id === variantId ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
    )
  },
  remove(variantId: number) {
    cartStore.set((prev) => prev.filter((l) => l.variant_id !== variantId))
  },
  clear() {
    cartStore.set([])
  },
}

export function useCartCount(): number {
  return cartStore.use().reduce((s, l) => s + l.qty, 0)
}

// ---------------------------------------------------------------- Sevimlilər
/** Sevimlilər lokal saxlanır (hesab yoxdur). Siyahı üçün son məlum məlumat da saxlanır. */
export const favoritesStore = createPersistentStore<ProductSummary[]>('alcostore.favorites.v1', [])

export const favorites = {
  toggle(p: ProductSummary) {
    favoritesStore.set((prev) => (prev.some((f) => f.id === p.id) ? prev.filter((f) => f.id !== p.id) : [p, ...prev]))
  },
}

export function useIsFavorite(id: number): boolean {
  return favoritesStore.use().some((f) => f.id === id)
}

// ---------------------------------------------------------------- Tətbiq vəziyyəti
export interface AppPrefs {
  ageConfirmed: boolean
  deviceId: string
  /** İstifadəçinin tətbiqdaxili bildiriş seçimi (sistem icazəsindən ayrı) */
  pushEnabled: boolean
  /** Bildiriş izah kartı göstərilib/bağlanıb */
  pushPromptDismissed: boolean
}

export const prefsStore = createPersistentStore<AppPrefs>('alcostore.prefs.v1', {
  ageConfirmed: false,
  deviceId: '',
  pushEnabled: true,
  pushPromptDismissed: false,
})

export async function hydrateAll() {
  await Promise.all([cartStore.hydrate(), favoritesStore.hydrate(), prefsStore.hydrate()])
  if (!prefsStore.get().deviceId) {
    prefsStore.set((p) => ({ ...p, deviceId: Crypto.randomUUID() }))
  }
}
