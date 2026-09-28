import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatPrice } from '@alcostore/shared'
import { ProductBuyPanel } from '@/components/ProductBuyPanel'
import { ProductImage } from '@/components/ProductImage'
import { ProductCard } from '@/components/ProductCard'
import { api } from '@/lib/api'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await api.product((await params).slug)
  if (!p) return {}
  const inStock = p.variants.filter((v) => v.stock > 0)
  const pool = inStock.length ? inStock : p.variants
  const from = pool.length ? Math.min(...pool.map((v) => v.price)) : null
  return {
    title: `${p.name}${from ? ` — ${formatPrice(from)}` : ''}`,
    description: p.description_az ?? `${p.name} — ${p.category_name}, ${p.country ?? ''}`,
    alternates: { canonical: `/mehsul/${p.slug}` },
    openGraph: p.images[0] ? { images: [p.images[0].url] } : undefined,
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const [product, settings] = await Promise.all([api.product(slug), api.settings()])
  if (!product) notFound()
  const related = await api.products({ category: product.category_slug, page_size: 5 })

  const specs = [
    product.abv !== null ? ['Spirt', `${product.abv}%`] : null,
    product.country ? ['Ölkə', product.country] : null,
    product.brand ? ['Brend', product.brand] : null,
    ['Qutu', product.has_gift_box ? 'Var' : 'Yoxdur'],
  ].filter(Boolean) as [string, string][]

  return (
    <div className="py-8">
      <Link href={`/kateqoriya/${product.category_slug}`} className="text-sm text-muted hover:text-gold">
        ‹ {product.category_name}
      </Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2 md:gap-14">
        <div className="relative aspect-square overflow-hidden rounded-[18px] border border-line bg-gradient-to-b from-[#2A201A] to-[#14100E]">
          <ProductImage url={product.images[0]?.url} category={product.category_slug} name={product.name} fit="contain" />
          <span className="absolute right-4 top-4 rounded-full border border-line-strong px-2 py-0.5 font-mono text-xs text-text3">18+</span>
        </div>
        <div>
          <div className="kicker text-red">
            {product.category_name}
            {product.country ? ` · ${product.country}` : ''}
          </div>
          <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">{product.name}</h1>
          <ProductBuyPanel product={product} settings={settings} />
          {product.description_az ? <p className="mt-8 leading-relaxed text-text3">{product.description_az}</p> : null}
          <dl className="mt-6 divide-y divide-line rounded-[14px] border border-line">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-3 text-sm">
                <dt className="text-muted">{k}</dt>
                <dd className="text-text">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {related.items.filter((p) => p.id !== product.id).length ? (
        <section className="pt-16">
          <h2 className="font-serif text-3xl">Oxşar məhsullar</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {related.items
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
          </div>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            brand: product.brand ?? undefined,
            description: product.description_az ?? undefined,
            image: product.images.map((i) => i.url),
            offers: product.variants.map((v) => ({
              '@type': 'Offer',
              priceCurrency: 'AZN',
              price: v.price,
              availability: v.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            })),
          }),
        }}
      />
    </div>
  )
}
