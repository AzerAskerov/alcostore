/**
 * Bump Alco Store mobile marketing version in app.config.js + package.json.
 *
 * Env:
 *   VERSION_OVERRIDE — optional exact version (e.g. 1.1). If empty, bumps last segment.
 *   GITHUB_OUTPUT — optional; writes version=...
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const configPath = path.join(root, 'app.config.js')
const pkgPath = path.join(root, 'package.json')

function bumpLastSegment(version) {
  const parts = version.split('.')
  if (parts.length === 0 || parts.some((p) => Number.isNaN(Number(p)))) {
    throw new Error(`Invalid version: ${version}`)
  }
  const last = Number(parts[parts.length - 1])
  parts[parts.length - 1] = String(last + 1)
  return parts.join('.')
}

const config = fs.readFileSync(configPath, 'utf8')
const match = config.match(/version:\s*'([^']+)'/)
if (!match) {
  console.error('❌ app.config.js içində version tapılmadı')
  process.exit(1)
}

const current = match[1]
const override = process.env.VERSION_OVERRIDE?.trim()
const next = override || bumpLastSegment(current)

if (override && override === current) {
  console.error(`❌ VERSION_OVERRIDE (${override}) cari versiya ilə eynidir`)
  process.exit(1)
}

const updatedConfig = config.replace(/version:\s*'[^']+'/, `version: '${next}'`)
fs.writeFileSync(configPath, updatedConfig)

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
pkg.version = next
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

console.log(`✅ Version bump: ${current} → ${next}`)

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${next}\n`)
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `previous_version=${current}\n`)
}
