// Google Play store listing qrafikası: ikon 512×512 və feature graphic 1024×500.
//   node scripts/make-store-assets.mjs
// Mənbə: alcostore-mobile/assets/icon.png (make-assets.mjs yaradır). Nəticə: store-assets/
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

const OUT = 'store-assets'
const ICON = 'alcostore-mobile/assets/icon.png'
const BG = '#0E0C0B'
mkdirSync(OUT, { recursive: true })

// Play ikon: 512×512, 32-bit PNG, şəffaflıq olmadan
await sharp(ICON).resize(512, 512).flatten({ background: BG }).png().toFile(`${OUT}/icon-512.png`)

// Feature graphic: 1024×500, solda loqo, sağda mətn
const W = 1024
const H = 500
const logoSize = 420
const text = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="25%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#2A1412"/>
      <stop offset="100%" stop-color="${BG}"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <g font-family="Arial, Helvetica, sans-serif" fill="#F4EDE4">
    <text x="500" y="190" font-size="68" font-weight="bold" fill="#E31E24">ALCO STORE</text>
    <text x="502" y="250" font-size="36" fill="#D8B26A">Şərab evi · Bakı</text>
    <rect x="502" y="282" width="420" height="2" fill="#D8B26A" opacity="0.6"/>
    <text x="502" y="336" font-size="26">Viski, konyak, şərab, pivə və daha çox</text>
    <text x="502" y="380" font-size="26">Sifariş WhatsApp-da · Bakıda çatdırılma</text>
    <text x="502" y="436" font-size="22" fill="#A89F95">Yalnız 18 yaşdan yuxarı · Məsuliyyətlə için</text>
  </g>
</svg>`)
const logo = await sharp(ICON).resize(logoSize, logoSize).png().toBuffer()
await sharp(text)
  .composite([{ input: logo, left: 50, top: Math.round((H - logoSize) / 2) }])
  .flatten({ background: BG })
  .removeAlpha()
  .png()
  .toFile(`${OUT}/feature-graphic-1024x500.png`)

console.log('✅ store-assets/ yaradıldı')
