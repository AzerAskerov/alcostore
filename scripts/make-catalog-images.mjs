// Instagram postlarından (assets-src/instagram, @alcostore.baku) məhsul şəkillərini hazırlayır:
// 3:4 kəsim (diqqət-mərkəzli), 900×1200 JPEG → api/seed-images/catalog/<slug>.jpg
//   node scripts/make-catalog-images.mjs
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

const SRC = 'assets-src/instagram'
const OUT = 'api/seed-images/catalog'
mkdirSync(OUT, { recursive: true })

// Instagram şəbəkəsindəki sıra nömrəsi → məhsul slug-u
export const MAP = {
  '00': 'proper-twelve',
  '01': 'johnnie-walker-black',
  '05': 'suzme-pive',
  '15': 'cenote-reposado',
  '16': 'sierra-tequila-blanco',
  '17': 'olmeca-gold',
  '23': 'jagermeister',
  '25': 'krasnoe-selo',
  '26': 'jim-beam-red-stag',
  '27': 'makers-mark',
  '31': 'absolut-original',
  '32': 'altus-vodka',
  '34': 'martini-bianco',
  '35': 'safari',
  '36': 'vat-69',
  '37': 'askaneli-vsop',
  '38': 'qiz-qalasi-7',
  '39': 'aberlour-16',
  '40': 'glenfiddich-15',
  '41': 'glenmorangie-10',
  '42': 'macallan-12-double-cask',
}
// Bannerlər / veb hero
const EXTRA = { '43': 'store-front', '21': 'store-night', '23': 'banner-jagermeister', '05': 'banner-suzme-pive' }

import { readdirSync } from 'node:fs'
const files = readdirSync(SRC).filter((f) => /^\d\d_.+\.jpg$/.test(f))
const byIdx = Object.fromEntries(files.map((f) => [f.slice(0, 2), `${SRC}/${f}`]))

for (const [idx, slug] of Object.entries(MAP)) {
  await sharp(byIdx[idx]).resize(900, 1200, { fit: 'cover', position: sharp.strategy.attention }).jpeg({ quality: 84, mozjpeg: true }).toFile(`${OUT}/${slug}.jpg`)
}
mkdirSync('api/seed-images/banners', { recursive: true })
for (const [idx, name] of Object.entries(EXTRA)) {
  await sharp(byIdx[idx]).resize(1600, 900, { fit: 'cover', position: sharp.strategy.attention }).jpeg({ quality: 82, mozjpeg: true }).toFile(`api/seed-images/banners/${name}.jpg`)
}
console.log(`✅ ${Object.keys(MAP).length} məhsul + ${Object.keys(EXTRA).length} banner şəkli`)
