'use client'

import Link from 'next/link'
import { useState } from 'react'
import { formatPrice, formatVolume, type Category, type Paginated, type ProductSummary } from '@alcostore/shared'
import { Btn, ErrorNote, PageTitle } from '@/components/admin/AdminShell'
import { ProductImage } from '@/components/ProductImage'
import { adminApi } from '@/lib/admin-api'
import { useLoad } from '@/lib/use-load'

export default function AdminProductsPage() {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const cats = useLoad(() => adminApi.get<Category[]>('/categories'))
  const { data, error } = useLoad(
    () => adminApi.get<Paginated<ProductSummary>>(`/products?page_size=100&q=${encodeURIComponent(search)}&category=${category}`),
    `${search}|${category}`,
  )

  return (
    <div className="space-y-4">
      <PageTitle
        title="Məhsullar"
        action={
          <Link href="/admin/products/new">
            <Btn>+ Yeni məhsul</Btn>
          </Link>
        }
      />
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setSearch(q)
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ad, brend, ölkə…" className="max-w-xs" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="max-w-[200px]">
          <option value="">Bütün kateqoriyalar</option>
          {cats.data?.map((c) => (
            <option key={c.id} value={c.slug}>{c.name_az}</option>
          ))}
        </select>
        <Btn variant="ghost" type="submit">Axtar</Btn>
      </form>
      <ErrorNote error={error} />
      <div className="text-sm text-muted">{data?.total ?? '…'} məhsul</div>
      <div className="overflow-x-auto rounded-[14px] border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-bar text-left text-xs text-muted">
            <tr>
              <th className="p-3" />
              <th className="p-3">Ad</th>
              <th className="p-3">Kateqoriya</th>
              <th className="p-3">Variant</th>
              <th className="p-3 text-right">Qiymət</th>
              <th className="p-3 text-right">Stok</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data?.items.map((p) => (
              <tr key={p.id} className="hover:bg-surface">
                <td className="w-12 p-2">
                  <div className="h-12 w-9 overflow-hidden rounded bg-surface2">
                    <ProductImage url={p.image_url} category={p.category_slug} name={p.name} />
                  </div>
                </td>
                <td className="p-3">
                  <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-gold">{p.name}</Link>
                  {p.is_featured ? <span className="ml-2 rounded bg-gold/15 px-1.5 text-[10px] text-gold">populyar</span> : null}
                  <div className="text-xs text-muted">{p.brand} · {p.country}</div>
                </td>
                <td className="p-3 text-text3">{p.category_name}</td>
                <td className="p-3 font-mono text-xs text-muted">
                  {p.variant ? formatVolume(p.variant.volume_ml, p.variant.pack_size) : '—'}
                  {p.variant_count > 1 ? ` +${p.variant_count - 1}` : ''}
                </td>
                <td className="p-3 text-right font-semibold text-gold">{p.variant ? formatPrice(p.variant.price) : '—'}</td>
                <td className={`p-3 text-right font-mono ${p.variant && p.variant.stock <= 0 ? 'text-red' : ''}`}>{p.variant?.stock ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
