'use client'

import { Check, Plus } from 'lucide-react'
import { useState } from 'react'
import type { CartLine } from '@alcostore/shared'
import { useCart } from '@/lib/cart'

export function AddToCartButton({
  line,
  qty = 1,
  compact = false,
}: {
  line: Omit<CartLine, 'qty'>
  qty?: number
  compact?: boolean
}) {
  const { add } = useCart()
  const [done, setDone] = useState(false)
  const onClick = () => {
    add(line, qty)
    setDone(true)
    setTimeout(() => setDone(false), 1200)
  }
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${line.name} səbətə at`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-red text-on-red transition hover:brightness-110"
      >
        {done ? <Check size={18} /> : <Plus size={18} />}
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[14px] border border-gold/50 font-semibold text-gold transition hover:bg-gold/10"
    >
      {done ? <Check size={18} /> : null}
      {done ? 'Səbətə əlavə olundu' : 'Səbətə at'}
    </button>
  )
}
