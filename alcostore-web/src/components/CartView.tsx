'use client'

import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  buildOrderMessage,
  cartTotals,
  formatPrice,
  formatVolume,
  type CreateOrderResult,
  type StoreSettings,
} from '@alcostore/shared'
import { API_URL } from '@/lib/config'
import { useCart } from '@/lib/cart'
import { ProductImage } from './ProductImage'

export function CartView({ settings }: { settings: StoreSettings }) {
  const { lines, ready, setQty, remove, clear } = useCart()
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const totals = cartTotals(lines, settings)

  if (!ready) return <div className="mt-8 h-40 animate-pulse rounded-[16px] bg-surface" />
  if (!lines.length) {
    return (
      <div className="mt-8 rounded-[16px] border border-line bg-surface p-10 text-center">
        <p className="text-muted">Səbətiniz boşdur.</p>
        <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-[14px] bg-red px-6 font-semibold text-on-red">
          Kataloqa keç
        </Link>
      </div>
    )
  }

  const preview = buildOrderMessage({
    storeName: settings.store_name,
    lines,
    subtotal: totals.subtotal,
    deliveryFee: totals.delivery_fee,
    total: totals.total,
    note,
  })

  const send = async () => {
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'web', note: note || undefined, items: lines.map((l) => ({ variant_id: l.variant_id, qty: l.qty })) }),
      })
      const data = (await res.json()) as CreateOrderResult & { error?: string }
      if (!res.ok) throw new Error(data.error || 'Sifariş göndərilmədi')
      clear()
      window.location.href = data.whatsapp_url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xəta baş verdi')
      setSending(false)
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
      <div className="divide-y divide-line rounded-[16px] border border-line bg-surface">
        {lines.map((l) => (
          <div key={l.variant_id} className="flex items-center gap-4 p-4">
            <Link href={`/mehsul/${l.slug}`} className="h-20 w-16 shrink-0 overflow-hidden rounded-[8px] bg-surface2">
              <ProductImage url={l.image_url} category={l.category_slug} name={l.name} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/mehsul/${l.slug}`} className="line-clamp-1 font-medium hover:text-gold">{l.name}</Link>
              <div className="font-mono text-xs text-muted">{formatVolume(l.volume_ml, l.pack_size)} · {formatPrice(l.unit_price)}</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-9 items-center rounded-[10px] border border-line">
                  <button aria-label="Azalt" className="px-3 text-text3" onClick={() => setQty(l.variant_id, l.qty - 1)}><Minus size={14} /></button>
                  <span className="w-6 text-center font-mono text-sm">{l.qty}</span>
                  <button aria-label="Artır" className="px-3 text-text3" onClick={() => setQty(l.variant_id, l.qty + 1)}><Plus size={14} /></button>
                </div>
                <button aria-label="Sil" className="text-faint hover:text-red" onClick={() => remove(l.variant_id)}><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="font-bold text-gold">{formatPrice(l.unit_price * l.qty)}</div>
          </div>
        ))}
      </div>

      <aside className="space-y-4">
        <div className="space-y-2 rounded-[16px] border border-line bg-surface p-5 text-sm">
          <Row k="Məhsullar" v={formatPrice(totals.subtotal)} />
          <Row
            k={`Çatdırılma · ${settings.delivery_area}`}
            v={totals.delivery_fee ? formatPrice(totals.delivery_fee) : <span className="text-wa">pulsuz</span>}
          />
          {totals.delivery_fee > 0 && settings.free_delivery_min > 0 ? (
            <p className="text-xs text-faint">{formatPrice(settings.free_delivery_min - totals.subtotal)} də əlavə edin — çatdırılma pulsuz olsun</p>
          ) : null}
          <div className="border-t border-line pt-3">
            <Row k={<span className="text-base text-text">Cəmi</span>} v={<span className="text-xl font-bold text-gold">{formatPrice(totals.total)}</span>} />
          </div>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          placeholder="Qeyd (istəyə görə): çatdırılma vaxtı, zəng etməyin və s."
          rows={2}
          className="w-full rounded-[12px] border border-line bg-surface p-3 text-sm placeholder:text-faint focus:border-gold focus:outline-none"
        />

        <div className="rounded-[16px] bg-wa-box p-4">
          <div className="kicker mb-2 text-[10px] text-wa">WhatsApp-a gedən mətn</div>
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-wa-text">{preview}</pre>
        </div>

        {totals.below_min_by > 0 ? (
          <p className="text-sm text-red">Minimum sifariş {formatPrice(settings.min_order)}. Daha {formatPrice(totals.below_min_by)} əlavə edin.</p>
        ) : null}
        {error ? <p className="text-sm text-red">{error}</p> : null}

        <button
          disabled={sending || totals.below_min_by > 0}
          onClick={send}
          className="h-14 w-full rounded-[14px] bg-wa font-semibold text-on-wa transition disabled:opacity-50"
        >
          {sending ? 'Göndərilir…' : 'Sifarişi WhatsApp-a göndər'}
        </button>
        <p className="text-center text-xs text-faint">Ödəniş və vaxt WhatsApp-da təsdiqlənir · 18 yaşdan yuxarı</p>
      </aside>
    </div>
  )
}

function Row({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{k}</span>
      <span>{v}</span>
    </div>
  )
}
