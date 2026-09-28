import type { MetadataRoute } from 'next'
import { BASE_URL, IS_PROD } from '@/lib/config'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  if (!IS_PROD) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/sebet', '/axtaris'] },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
