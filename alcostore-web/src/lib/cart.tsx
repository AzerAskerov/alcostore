'use client'

import { useCallback, useMemo } from 'react'
import type { CartLine } from '@alcostore/shared'
import { readLocal, useLocalValue, writeLocal } from './local-store'

const KEY = 'alcostore.cart.v1'
const MAX_QTY = 50

interface CartApi {
  lines: CartLine[]
  ready: boolean
  count: number
  add: (line: Omit<CartLine, 'qty'>, qty?: number) => void
  setQty: (variantId: number, qty: number) => void
  remove: (variantId: number) => void
  clear: () => void
}

function parse(raw: string | null | undefined): CartLine[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as CartLine[]
    return Array.isArray(parsed) ? parsed.filter((l) => l && l.variant_id && l.qty > 0) : []
  } catch {
    return []
  }
}

function update(fn: (lines: CartLine[]) => CartLine[]) {
  writeLocal(KEY, JSON.stringify(fn(parse(readLocal(KEY)))))
}

/** Səbət localStorage-da saxlanır; bütün komponentlər və tablar sinxron qalır. */
export function useCart(): CartApi {
  const raw = useLocalValue(KEY)
  const lines = useMemo(() => parse(raw), [raw])

  const add = useCallback((line: Omit<CartLine, 'qty'>, qty = 1) => {
    update((prev) => {
      const i = prev.findIndex((l) => l.variant_id === line.variant_id)
      if (i === -1) return [...prev, { ...line, qty: Math.min(MAX_QTY, qty) }]
      const next = [...prev]
      next[i] = { ...next[i], ...line, qty: Math.min(MAX_QTY, next[i].qty + qty) }
      return next
    })
  }, [])

  const setQty = useCallback((variantId: number, qty: number) => {
    update((prev) =>
      qty <= 0
        ? prev.filter((l) => l.variant_id !== variantId)
        : prev.map((l) => (l.variant_id === variantId ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
    )
  }, [])

  const remove = useCallback((variantId: number) => update((p) => p.filter((l) => l.variant_id !== variantId)), [])
  const clear = useCallback(() => writeLocal(KEY, null), [])

  return {
    lines,
    ready: raw !== undefined,
    count: lines.reduce((s, l) => s + l.qty, 0),
    add,
    setQty,
    remove,
    clear,
  }
}
