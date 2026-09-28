import Link from 'next/link'
import { formatVolume, type Paginated, type ProductFacets, type ProductSort, type ProductSummary } from '@alcostore/shared'
import { ProductCard } from './ProductCard'

const SORT_LABELS: Record<ProductSort, string> = {
  popular: 'Populyar',
  price_asc: 'Qiymət ↑',
  price_desc: 'Qiymət ↓',
  name: 'Ad',
  new: 'Yeni',
}

export interface CatalogParams {
  sort?: ProductSort
  country?: string
  volume_ml?: number
  q?: string
  page?: number
}

function href(basePath: string, params: CatalogParams, patch: Partial<CatalogParams>) {
  const next = { ...params, ...patch }
  if (!('page' in patch)) delete next.page
  const p = new URLSearchParams()
  if (next.q) p.set('q', next.q)
  if (next.sort && next.sort !== 'popular') p.set('sort', next.sort)
  if (next.country) p.set('country', next.country)
  if (next.volume_ml) p.set('volume_ml', String(next.volume_ml))
  if (next.page && next.page > 1) p.set('page', String(next.page))
  const s = p.toString()
  return s ? `${basePath}?${s}` : basePath
}

function Chip({ active, to, children }: { active: boolean; to: string; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      scroll={false}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${active ? 'bg-red text-on-red' : 'border border-line text-text3 hover:border-gold hover:text-gold'}`}
    >
      {children}
    </Link>
  )
}

export function CatalogView({
  basePath,
  params,
  facets,
  result,
}: {
  basePath: string
  params: CatalogParams
  facets: ProductFacets
  result: Paginated<ProductSummary>
}) {
  const pages = Math.ceil(result.total / result.page_size)
  return (
    <div>
      <div className="space-y-3">
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {(Object.keys(SORT_LABELS) as ProductSort[]).map((s) => (
            <Chip key={s} active={(params.sort ?? 'popular') === s} to={href(basePath, params, { sort: s })}>
              {SORT_LABELS[s]}
            </Chip>
          ))}
        </div>
        {facets.countries.length > 1 ? (
          <div className="scrollbar-none flex gap-2 overflow-x-auto">
            <Chip active={!params.country} to={href(basePath, params, { country: undefined })}>
              Bütün ölkələr
            </Chip>
            {facets.countries.map((c) => (
              <Chip key={c} active={params.country === c} to={href(basePath, params, { country: c })}>
                {c}
              </Chip>
            ))}
          </div>
        ) : null}
        {facets.volumes.length > 1 ? (
          <div className="scrollbar-none flex gap-2 overflow-x-auto">
            <Chip active={!params.volume_ml} to={href(basePath, params, { volume_ml: undefined })}>
              Bütün həcmlər
            </Chip>
            {facets.volumes.map((v) => (
              <Chip key={v} active={params.volume_ml === v} to={href(basePath, params, { volume_ml: v })}>
                {formatVolume(v)}
              </Chip>
            ))}
          </div>
        ) : null}
      </div>

      {result.items.length ? (
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {result.items.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-[16px] border border-line bg-surface p-10 text-center text-muted">
          Heç nə tapılmadı. Filtrləri dəyişin və ya WhatsApp-da soruşun.
        </div>
      )}

      {pages > 1 ? (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Chip key={n} active={n === result.page} to={href(basePath, params, { page: n })}>
              {n}
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function parseCatalogParams(sp: Record<string, string | string[] | undefined>): CatalogParams {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined))
  const sort = one('sort') as ProductSort | undefined
  const vol = Number(one('volume_ml'))
  const page = Number(one('page'))
  return {
    sort: sort && sort in SORT_LABELS ? sort : undefined,
    country: one('country') || undefined,
    volume_ml: Number.isFinite(vol) && vol > 0 ? vol : undefined,
    q: one('q')?.slice(0, 80) || undefined,
    page: Number.isFinite(page) && page > 1 ? page : undefined,
  }
}
