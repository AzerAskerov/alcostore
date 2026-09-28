import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CatalogView, parseCatalogParams } from '@/components/CatalogView'
import { api } from '@/lib/api'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cat = (await api.categories()).find((c) => c.slug === slug)
  return cat
    ? { title: `${cat.name_az} — qiymətlər`, description: `${cat.name_az} kataloqu: qiymətlər, həcmlər və ölkələr. Bakı daxili çatdırılma.`, alternates: { canonical: `/kateqoriya/${slug}` } }
    : {}
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const cp = parseCatalogParams(await searchParams)
  const [categories, facets, result] = await Promise.all([
    api.categories(),
    api.facets(slug),
    api.products({ category: slug, sort: cp.sort, country: cp.country, volume_ml: cp.volume_ml, page: cp.page, page_size: 24 }),
  ])
  const cat = categories.find((c) => c.slug === slug)
  if (!cat) notFound()

  return (
    <div className="py-10">
      <Link href="/" className="text-sm text-muted hover:text-gold">‹ Ana səhifə</Link>
      <div className="mt-3 flex items-baseline gap-4">
        <h1 className="font-serif text-5xl">{cat.name_az}</h1>
        <span className="font-mono text-sm text-muted">{result.total} məhsul</span>
      </div>
      <div className="mt-8">
        <CatalogView basePath={`/kateqoriya/${slug}`} params={cp} facets={facets} result={result} />
      </div>
    </div>
  )
}
