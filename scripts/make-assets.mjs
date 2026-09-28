// Loqodan (assets-src/logo.png) veb və mobil ikonları yaradır.
//   node scripts/make-assets.mjs
// Qeyd: mənbə loqo 418×418-dir; 1024 ikon üçün yüksək keyfiyyətli (≥1024 px) loqo gələndə
// assets-src/logo.png-i əvəz edib skripti yenidən işə salın.
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

const SRC = 'assets-src/logo.png'
const BG = '#0E0C0B'
const web = 'alcostore-web/public'
const mob = 'alcostore-mobile/assets'
mkdirSync(web, { recursive: true })
mkdirSync(mob, { recursive: true })

const logo = (size) => sharp(SRC).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()

async function onBg(size, logoScale, out, extra = []) {
  const inner = Math.round(size * logoScale)
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: await logo(inner), gravity: 'center' }, ...extra])
    .png()
    .toFile(out)
}

// Veb
await sharp(SRC).resize(256, 256).png().toFile(`${web}/logo.png`)
await sharp(SRC).resize(64, 64).png().toFile(`${web}/favicon.png`)
await onBg(512, 0.94, `${web}/og.png`)

// iOS/Android ikon (şəffaflıq olmamalıdır)
await onBg(1024, 0.94, `${mob}/icon.png`)
const devBadge = Buffer.from(
  `<svg width="1024" height="1024"><rect x="0" y="820" width="1024" height="204" fill="#E31E24"/>
   <text x="512" y="960" font-family="Arial" font-weight="bold" font-size="140" fill="#fff" text-anchor="middle">DEV</text></svg>`,
)
await onBg(1024, 0.94, `${mob}/icon-dev.png`, [{ input: devBadge }])

// Android adaptive: ön plan təhlükəsiz zonada (~66%)
async function adaptive(out, extra = []) {
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await logo(640), gravity: 'center' }, ...extra])
    .png()
    .toFile(out)
}
await adaptive(`${mob}/adaptive-icon.png`)
await adaptive(`${mob}/adaptive-icon-dev.png`, [{ input: devBadge }])

// Splash
await sharp(await logo(600)).toFile(`${mob}/splash-icon.png`)

// Android bildiriş ikonu: ağ siluet, şəffaf fon
const bottle = Buffer.from(
  `<svg width="96" height="96" viewBox="0 0 96 96"><path fill="#fff" d="M41 8h14v20l10 8v50c0 2-2 4-4 4H35c-2 0-4-2-4-4V36l10-8z"/></svg>`,
)
await sharp(bottle).png().toFile(`${mob}/notification-icon.png`)

console.log('✅ assets yaradıldı')
