import type {
  Category,
  HomePayload,
  Paginated,
  Product,
  ProductFacets,
  ProductQuery,
  ProductSummary,
  StoreSettings,
} from '@alcostore/shared'
import { API_URL } from './config'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store', headers: { Accept: 'application/json' } })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new ApiError(res.status, body.error || `API ${res.status}`)
  }
  return res.json() as Promise<T>
}

function qs(q: Record<string, string | number | boolean | undefined>): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== '' && v !== false) p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const api = {
  home: () => get<HomePayload>('/home'),
  settings: () => get<StoreSettings>('/settings'),
  categories: () => get<Category[]>('/categories'),
  products: (q: ProductQuery) => get<Paginated<ProductSummary>>(`/products${qs({ ...q })}`),
  facets: (category?: string) => get<ProductFacets>(`/products/facets${qs({ category })}`),
  product: async (slug: string) => {
    try {
      return await get<Product>(`/products/${encodeURIComponent(slug)}`)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }
  },
}
