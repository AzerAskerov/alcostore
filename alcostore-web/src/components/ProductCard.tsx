import Link from 'next/link'
import { discountPercent, formatPrice, formatVolume, type ProductSummary } from '@alcostore/shared'
import { AddToCartButton } from './AddToCartButton'
import { ProductImage } from './ProductImage'

export function ProductCard({ p }: { p: ProductSummary }) {
  const v = p.variant
  const off = v ? discountPercent(v.price, v.old_price) : null
  const soldOut = !v || v.stock <= 0
  return (
    <div className="group flex flex-col overflow-hidden rounded-[16px] border border-line bg-surface transition hover:border-line-strong">
      <Link href={`/mehsul/${p.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-surface2">
        <ProductImage url={p.image_url} category={p.category_slug} name={p.name} className="transition duration-300 group-hover:scale-[1.03]" />
        {off ? (
          <span className="absolute left-3 top-3 rounded-full bg-red px-2 py-0.5 text-[11px] font-bold text-on-red">−{off}%</span>
        ) : null}
        {soldOut ? (
          <span className="absolute inset-x-3 bottom-3 rounded-lg bg-black/70 py-1 text-center text-xs text-text3">Stokda yoxdur</span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="kicker text-[10px] text-red">{p.category_name}</span>
        <Link href={`/mehsul/${p.slug}`} className="line-clamp-2 font-medium leading-snug text-text hover:text-gold">
          {p.name}
        </Link>
        <span className="font-mono text-xs text-muted">
          {v ? formatVolume(v.volume_ml, v.pack_size) : '—'}
          {p.country ? ` · ${p.country}` : ''}
        </span>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex flex-col">
            {v?.old_price && off ? <span className="text-xs text-faint line-through">{formatPrice(v.old_price)}</span> : null}
            <span className="text-lg font-bold text-gold">{v ? formatPrice(v.price) : '—'}</span>
          </div>
          {v && !soldOut ? (
            <AddToCartButton
              compact
              line={{
                product_id: p.id,
                variant_id: v.id,
                slug: p.slug,
                name: p.name,
                volume_ml: v.volume_ml,
                pack_size: v.pack_size,
                unit_price: v.price,
                image_url: p.image_url,
                category_slug: p.category_slug,
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
