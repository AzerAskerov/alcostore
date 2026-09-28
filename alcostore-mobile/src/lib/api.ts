import type {
  Category,
  CreateOrderInput,
  CreateOrderResult,
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch {
    throw new ApiError(0, 'İnternet bağlantısını yoxlayın')
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new ApiError(res.status, data.error || 'Xəta baş verdi')
  return data
}

function qs(q: Record<string, unknown>): string {
  const p = Object.entries(q)
    .filter(([, v]) => v !== undefined && v !== '' && v !== false && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
  return p.length ? `?${p.join('&')}` : ''
}

export const api = {
  home: () => request<HomePayload>('/home'),
  settings: () => request<StoreSettings>('/settings'),
  categories: () => request<Category[]>('/categories'),
  products: (q: ProductQuery) => request<Paginated<ProductSummary>>(`/products${qs({ ...q })}`),
  facets: (category?: string) => request<ProductFacets>(`/products/facets${qs({ category })}`),
  product: (slug: string) => request<Product>(`/products/${encodeURIComponent(slug)}`),
  createOrder: (input: CreateOrderInput) =>
    request<CreateOrderResult>('/orders', { method: 'POST', body: JSON.stringify(input) }),
  registerDevice: (body: {
    device_id: string
    platform: 'ios' | 'android'
    push_token?: string | null
    locale?: string
    app_version?: string
    push_enabled?: boolean
  }) => request<{ ok: true }>('/devices/register', { method: 'POST', body: JSON.stringify(body) }),
}
