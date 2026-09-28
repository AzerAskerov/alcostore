'use client'

import { Minus, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  buildProductQuestion,
  discountPercent,
  formatPrice,
  formatVolume,
  whatsappUrl,
  type Product,
  type StoreSettings,
} from '@alcostore/shared'
import { AddToCartButton } from './AddToCartButton'

export function ProductBuyPanel({ product, settings }: { product: Product; settings: StoreSettings }) {
  const variants = product.variants
  const initial = useMemo(() => {
    const inStock = variants.filter((v) => v.stock > 0)
    return (inStock.length ? inStock : variants).sort((a, b) => a.price - b.price)[0]
  }, [variants])
  const [selectedId, setSelectedId] = useState(initial?.id)
  const [qty, setQty] = useState(1)
  const v = variants.find((x) => x.id === selectedId) ?? initial

  if (!v) return <p className="mt-6 text-muted">Bu məhsul hazırda satışda yoxdur.</p>
  const off = discountPercent(v.price, v.old_price)
  const soldOut = v.stock <= 0

  return (
    <div className="mt-6">
      {variants.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {variants.map((x) => {
            const out = x.stock <= 0
            const active = x.id === v.id
            return (
              <button
                key={x.id}
                type="button"
                disabled={out}
                onClick={() => {
                  setSelectedId(x.id)
                  setQty(1)
                }}
                className={`rounded-[10px] px-4 py-2 font-mono text-sm transition ${
                  active ? 'bg-red text-on-red' : out ? 'cursor-not-allowed border border-line text-faint' : 'border border-line-strong text-text3 hover:border-gold'
                }`}
              >
                {formatVolume(x.volume_ml, x.pack_size)}
                {out ? ' · yoxdur' : ''}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="font-mono text-sm text-muted">{formatVolume(v.volume_ml, v.pack_size)}</div>
      )}

      <div className="mt-6 flex items-end gap-3">
        <span className="text-[34px] font-bold leading-none text-gold">{formatPrice(v.price)}</span>
        {off && v.old_price ? (
          <>
            <span className="pb-1 text-lg text-faint line-through">{formatPrice(v.old_price)}</span>
            <span className="mb-1 rounded-full bg-red px-2 py-0.5 text-xs font-bold text-on-red">−{off}%</span>
          </>
        ) : null}
      </div>
      <div className={`mt-2 text-sm ${soldOut ? 'text-red' : 'text-muted'}`}>
        {soldOut ? 'Stokda yoxdur' : v.stock <= 3 ? `Son ${v.stock} ədəd` : 'Stokda var'}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!soldOut ? (
          <div className="flex h-14 items-center rounded-[14px] border border-line">
            <button type="button" aria-label="Azalt" className="px-4 text-text3" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              <Minus size={16} />
            </button>
            <span className="w-8 text-center font-mono">{qty}</span>
            <button type="button" aria-label="Artır" className="px-4 text-text3" onClick={() => setQty((q) => Math.min(Math.min(50, v.stock), q + 1))}>
              <Plus size={16} />
            </button>
          </div>
        ) : null}
        {!soldOut ? (
          <AddToCartButton
            qty={qty}
            line={{
              product_id: product.id,
              variant_id: v.id,
              slug: product.slug,
              name: product.name,
              volume_ml: v.volume_ml,
              pack_size: v.pack_size,
              unit_price: v.price,
              image_url: product.images[0]?.url ?? null,
              category_slug: product.category_slug,
            }}
          />
        ) : null}
        <a
          href={whatsappUrl(settings.whatsapp_number, buildProductQuestion(settings.store_name, product.name, v.volume_ml, v.pack_size))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 flex-1 items-center justify-center rounded-[14px] bg-wa font-semibold text-on-wa"
        >
          WhatsApp
        </a>
      </div>
      <p className="mt-3 text-xs text-faint">{settings.whatsapp_number} · Ödəniş çatdırılma zamanı</p>
    </div>
  )
}
