// App Store 6.9" iPhone screenshot-ları (1320×2868): Android screenshot-larını başlıqlı çərçivəyə yerləşdirir.
//   node scripts/make-appstore-screenshots.mjs
// Mənbə: store-assets/screenshots/*.png (1080×1920). Nəticə: store-assets/appstore/
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

const SRC = 'store-assets/screenshots'
const OUT = 'store-assets/appstore'
const W = 1320
const H = 2868
const BG = '#0E0C0B'
mkdirSync(OUT, { recursive: true })

const shots = [
  { file: '01-home.png', title: 'Bakıda içki mağazası', sub: 'Kampaniyalar və yeni məhsullar' },
  { file: '02-kataloq.png', title: 'Geniş kataloq', sub: 'Viski, konyak, araq, pivə və daha çox' },
  { file: '04-mehsul.png', title: 'Hər məhsul haqqında', sub: 'Şəkil, həcm və qiymət' },
  { file: '05-sebet.png', title: 'Sifariş WhatsApp-da', sub: 'Səbəti yığ, bir toxunuşla göndər' },
  { file: '06-age-gate.png', title: 'Yalnız 18+', sub: 'Məsuliyyətlə için' },
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const shotW = 1120
const shotH = Math.round((shotW * 1920) / 1080) // 1991
const top = H - shotH - 140
const radius = 56

const mask = Buffer.from(
  `<svg width="${shotW}" height="${shotH}"><rect width="${shotW}" height="${shotH}" rx="${radius}" ry="${radius}"/></svg>`,
)

for (const [i, s] of shots.entries()) {
  const bg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="50%" cy="15%" r="85%">
      <stop offset="0%" stop-color="#2A1412"/>
      <stop offset="100%" stop-color="${BG}"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <g font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
    <text x="${W / 2}" y="330" font-size="96" font-weight="bold" fill="#F4EDE4">${esc(s.title)}</text>
    <text x="${W / 2}" y="450" font-size="54" fill="#D8B26A">${esc(s.sub)}</text>
  </g>
  <rect x="${(W - shotW) / 2 - 6}" y="${top - 6}" width="${shotW + 12}" height="${shotH + 12}" rx="${radius + 6}" fill="#3A2A26"/>
</svg>`)
  const shot = await sharp(`${SRC}/${s.file}`)
    .resize(shotW, shotH)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
  const name = `${String(i + 1).padStart(2, '0')}-${s.file.replace(/^\d+-/, '')}`
  await sharp(bg)
    .composite([{ input: shot, left: (W - shotW) / 2, top }])
    .flatten({ background: BG })
    .removeAlpha()
    .png()
    .toFile(`${OUT}/${name}`)
  console.log('✅', `${OUT}/${name}`)
}
