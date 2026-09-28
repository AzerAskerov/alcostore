import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@alcostore/shared'],
  images: { unoptimized: true },
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Dev host heç vaxt indekslənməməlidir.
        source: '/:path*',
        has: [{ type: 'host', value: 'dev.alcostore.az' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default nextConfig
