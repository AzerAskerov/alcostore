// api/seed-images/**  →  R2 (IMAGES_BUCKET). Açar = fayl yolu (catalog/<slug>.jpg, banners/<name>.jpg),
// migrations/0004-dəki product_images.r2_key / banners.image_key ilə eynidir.
//   node scripts/upload-seed-images.mjs --env local   (wrangler dev-in local R2-si)
//   node scripts/upload-seed-images.mjs --env dev     (alcostore-imgs-dev — yalnız təsdiqdən sonra)
//   node scripts/upload-seed-images.mjs --env prod    (alcostore-imgs)
import { execFileSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const env = process.argv[process.argv.indexOf('--env') + 1] || 'local'
const buckets = { local: 'alcostore-imgs-local', dev: 'alcostore-imgs-dev', prod: 'alcostore-imgs' }
const bucket = buckets[env]
if (!bucket) throw new Error(`--env local|dev|prod`)

const root = 'seed-images'
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
const files = walk(root).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))

const flags = env === 'local' ? ['--local', '--env', 'local'] : env === 'dev' ? ['--remote', '--env', 'dev'] : ['--remote']
for (const f of files) {
  const key = relative(root, f).split(sep).join('/')
  execFileSync('npx', ['wrangler', 'r2', 'object', 'put', `${bucket}/${key}`, '--file', f, '--content-type', 'image/jpeg', ...flags], {
    stdio: ['ignore', 'ignore', 'inherit'],
    shell: process.platform === 'win32',
  })
  console.log('↑', key)
}
console.log(`✅ ${files.length} şəkil → ${bucket} (${env})`)
