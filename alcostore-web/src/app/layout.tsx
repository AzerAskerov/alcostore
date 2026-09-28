import type { Metadata, Viewport } from 'next'
import { DM_Mono, DM_Sans, Instrument_Serif } from 'next/font/google'
import { BASE_URL, IS_PROD } from '@/lib/config'
import './globals.css'

const sans = DM_Sans({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '700'], variable: '--font-dm-sans' })
const serif = Instrument_Serif({ subsets: ['latin', 'latin-ext'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument-serif' })
const mono = DM_Mono({ subsets: ['latin', 'latin-ext'], weight: ['400', '500'], variable: '--font-dm-mono' })

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: 'Alco Store — Şərab evi · Bakı', template: '%s · Alco Store' },
  description:
    'Şərab, viski, konyak, araq, pivə və şampan. Qiymətlər saytda açıq göstərilir, sifariş WhatsApp-da tamamlanır. Bakı daxili çatdırılma.',
  icons: { icon: '/favicon.png', apple: '/logo.png' },
  robots: IS_PROD ? undefined : { index: false, follow: false },
  openGraph: { type: 'website', locale: 'az_AZ', siteName: 'Alco Store', images: ['/logo.png'] },
}

export const viewport: Viewport = {
  themeColor: '#0E0C0B',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
