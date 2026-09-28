import type { MetadataRoute } from 'next'
import { api } from '@/lib/api'
import { BASE_URL } from '@/lib/config'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([api.categories(), api.products({ page_size: 100 })])
  return [
    { url: `${BASE_URL}/`, changeFrequency: 'daily', priority: 1 },
    ...categories.map((c) => ({ url: `${BASE_URL}/kateqoriya/${c.slug}`, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...products.items.map((p) => ({ url: `${BASE_URL}/mehsul/${p.slug}`, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...['privacy', 'terms', 'support'].map((s) => ({ url: `${BASE_URL}/${s}`, priority: 0.2 })),
  ]
}
