import type { Metadata } from 'next'
import { Search } from 'lucide-react'
import { CatalogView, parseCatalogParams } from '@/components/CatalogView'
import { api } from '@/lib/api'

export const metadata: Metadata = { title: 'Axtarış', robots: { index: false } }

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const cp = parseCatalogParams(await searchParams)
  const [facets, result] = await Promise.all([
    api.facets(),
    api.products({ q: cp.q, sort: cp.sort, country: cp.country, volume_ml: cp.volume_ml, page: cp.page, page_size: 24 }),
  ])
  return (
    <div className="py-10">
      <form action="/axtaris" className="flex max-w-xl items-center gap-2 rounded-[12px] border border-line bg-surface px-4">
        <Search size={18} className="text-muted" />
        <input
          name="q"
          defaultValue={cp.q}
          placeholder="Məhsul axtar…"
          autoFocus
          className="h-12 w-full bg-transparent text-text placeholder:text-faint focus:outline-none"
        />
      </form>
      <h1 className="mt-8 font-serif text-4xl">
        {cp.q ? <>«{cp.q}» üçün nəticələr</> : 'Bütün məhsullar'} <span className="font-mono text-sm text-muted">{result.total}</span>
      </h1>
      <div className="mt-6">
        <CatalogView basePath="/axtaris" params={cp} facets={facets} result={result} />
      </div>
    </div>
  )
}
