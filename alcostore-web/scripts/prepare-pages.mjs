// OpenNext çıxışını Cloudflare Pages formatına salır (TurMat-dakı "Prepare Pages Deployment" addımı).
import { cpSync, existsSync, mkdirSync } from 'node:fs'

const out = '.open-next'
const assets = `${out}/assets`
if (!existsSync(`${out}/worker.js`)) {
  console.error('✖ .open-next/worker.js yoxdur — əvvəlcə `npm run build:pages`')
  process.exit(1)
}
cpSync(`${out}/worker.js`, `${assets}/_worker.js`)
for (const dir of ['cloudflare', 'middleware', '.build', 'server-functions']) {
  if (existsSync(`${out}/${dir}`)) cpSync(`${out}/${dir}`, `${assets}/${dir}`, { recursive: true })
}
if (existsSync('.next/server/prefetch-hints.json')) {
  mkdirSync(`${assets}/.next/server`, { recursive: true })
  cpSync('.next/server/prefetch-hints.json', `${assets}/.next/server/prefetch-hints.json`)
}
if (existsSync('public')) cpSync('public', assets, { recursive: true })
console.log('✅ Pages üçün hazırdır:', assets)
