/**
 * Submit the uploaded iOS build for App Review and auto-release after approval.
 *
 * Flow:
 * 1. Wait until ASC build (version + buildNumber) is VALID
 * 2. Ensure App Store version exists (create if needed)
 * 3. Attach build, set releaseType=AFTER_APPROVAL, encryption + whatsNew
 * 4. Create/reuse reviewSubmission and submit
 *
 * Env:
 *   ASC_APP_ID, ASC_API_KEY_ID, ASC_API_ISSUER_ID, ASC_API_KEY_PATH
 *   APP_VERSION (e.g. 4.6), BUILD_NUMBER (e.g. 98)
 *   WHATS_NEW — App Store "What's New" text (required when REQUIRE_WHATS_NEW=1)
 *   REQUIRE_WHATS_NEW — set to 1 in CI to forbid empty/default notes
 *   RELEASE_TYPE — MANUAL (defolt: təsdiqdən sonra "Pending Developer Release"-də gözləyir,
 *                  real data hazır olanda ASC-dən əl ilə açılır) | AFTER_APPROVAL (TurMat kimi avtomatik)
 *
 * TurMat-dan (turmat-mobile/scripts/ascSubmitForReview.mjs) götürülüb; fərq yalnız RELEASE_TYPE-dır.
 */

import crypto from 'node:crypto'
import fs from 'node:fs'

const ASC_BASE = 'https://api.appstoreconnect.apple.com/v1'
const POLL_MS = 20_000
const MAX_WAIT_MS = 45 * 60 * 1000

const appId = required('ASC_APP_ID')
const keyId = required('ASC_API_KEY_ID')
const issuerId = required('ASC_API_ISSUER_ID')
const keyPath = required('ASC_API_KEY_PATH')
const appVersion = required('APP_VERSION')
const buildNumber = required('BUILD_NUMBER')
const requireWhatsNew = process.env.REQUIRE_WHATS_NEW === '1'
const whatsNew = process.env.WHATS_NEW?.trim() || ''
const releaseType = process.env.RELEASE_TYPE?.trim() === 'AFTER_APPROVAL' ? 'AFTER_APPROVAL' : 'MANUAL'

if (requireWhatsNew && !whatsNew) {
  console.error('❌ WHATS_NEW / release_notes boş ola bilməz')
  process.exit(1)
}

const whatsNewText =
  whatsNew ||
  `Alco Store ${appVersion} — təkmilləşdirmələr və düzəlişlər.`

const privateKey = fs.readFileSync(keyPath, 'utf8')
/** @type {{ token: string, exp: number } | null} */
let cachedJwt = null

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    console.error(`❌ Missing env: ${name}`)
    process.exit(1)
  }
  return value
}

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function createToken(force = false) {
  const now = Math.floor(Date.now() / 1000)
  // Reuse token until ~2 minutes before expiry (Apple allows max 20m).
  if (!force && cachedJwt && cachedJwt.exp - now > 120) {
    return cachedJwt.token
  }

  const exp = now + 18 * 60
  const header = b64url(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }))
  const payload = b64url(
    JSON.stringify({
      iss: issuerId,
      iat: now,
      exp,
      aud: 'appstoreconnect-v1',
    })
  )
  const data = `${header}.${payload}`
  const sig = crypto.sign('sha256', Buffer.from(data), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  })
  cachedJwt = { token: `${data}.${b64url(sig)}`, exp }
  return cachedJwt.token
}

async function asc(method, path, body, { retryOn401 = true } = {}) {
  const url = path.startsWith('http') ? path : `${ASC_BASE}/${path.replace(/^\//, '')}`
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${createToken()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  if (res.status === 401 && retryOn401) {
    createToken(true)
    return asc(method, path, body, { retryOn401: false })
  }
  if (!res.ok) {
    const err = new Error(`ASC ${method} ${path} → ${res.status}`)
    err.status = res.status
    err.payload = json
    throw err
  }
  return json
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForBuild() {
  const started = Date.now()
  console.log(`⏳ ASC build gözlənilir: v${appVersion} (${buildNumber})`)

  while (Date.now() - started < MAX_WAIT_MS) {
    const result = await asc(
      'GET',
      `builds?filter[app]=${appId}&filter[version]=${encodeURIComponent(buildNumber)}&filter[processingState]=VALID,PROCESSING,FAILED,INVALID&sort=-uploadedDate&limit=20`
    )
    const builds = result.data ?? []
    const match = builds.find((b) => {
      // ASC "version" filter is build number; marketing version is nested.
      return b.attributes?.version === String(buildNumber)
    })

    if (!match) {
      console.log('… build hələ ASC-də görünmür, gözləyirik')
      await sleep(POLL_MS)
      continue
    }

    const state = match.attributes.processingState
    console.log(`… build ${match.id} processingState=${state}`)
    if (state === 'VALID') return match
    if (state === 'FAILED' || state === 'INVALID') {
      throw new Error(`Build processing failed: ${state}`)
    }
    await sleep(POLL_MS)
  }

  throw new Error('Build VALID olmadı (timeout)')
}

async function ensureAppStoreVersion() {
  const listed = await asc(
    'GET',
    `apps/${appId}/appStoreVersions?filter[platform]=IOS&filter[versionString]=${encodeURIComponent(appVersion)}&limit=5`
  )
  if (listed.data?.length) {
    return listed.data[0]
  }

  console.log(`➕ App Store version yaradılır: ${appVersion}`)
  const created = await asc('POST', 'appStoreVersions', {
    data: {
      type: 'appStoreVersions',
      attributes: {
        platform: 'IOS',
        versionString: appVersion,
        releaseType,
      },
      relationships: {
        app: { data: { type: 'apps', id: appId } },
      },
    },
  })
  return created.data
}

async function attachBuild(versionId, buildId) {
  await asc('PATCH', `appStoreVersions/${versionId}/relationships/build`, {
    data: { type: 'builds', id: buildId },
  })
  console.log('✅ Build App Store version-a bağlandı')
}

async function setAutoRelease(versionId) {
  await asc('PATCH', `appStoreVersions/${versionId}`, {
    data: {
      type: 'appStoreVersions',
      id: versionId,
      attributes: { releaseType },
    },
  })
  console.log(`✅ releaseType=${releaseType}`)
}

async function setEncryption(buildId) {
  try {
    await asc('PATCH', `builds/${buildId}`, {
      data: {
        type: 'builds',
        id: buildId,
        attributes: { usesNonExemptEncryption: false },
      },
    })
    console.log('✅ usesNonExemptEncryption=false')
  } catch (error) {
    if (error.status === 409) {
      console.log('ℹ️ Encryption artıq set olunub (409) — davam')
      return
    }
    throw error
  }
}

async function setWhatsNew(versionId) {
  const locs = await asc('GET', `appStoreVersions/${versionId}/appStoreVersionLocalizations`)
  for (const loc of locs.data ?? []) {
    const locale = loc.attributes?.locale
    try {
      await asc('PATCH', `appStoreVersionLocalizations/${loc.id}`, {
        data: {
          type: 'appStoreVersionLocalizations',
          id: loc.id,
          attributes: { whatsNew: whatsNewText },
        },
      })
      console.log(`✅ whatsNew set (${locale})`)
    } catch (error) {
      // Tətbiqin ilk versiyasında (1.0) Apple "What's New" sahəsinə icazə vermir (409).
      if (error.status === 409) {
        console.log(`ℹ️ whatsNew keçildi (${locale}) — ilk versiyada bu sahə redaktə olunmur`)
        continue
      }
      throw error
    }
  }
}

const REVIEW_DONE_STATES = new Set([
  'WAITING_FOR_REVIEW',
  'IN_REVIEW',
  'PENDING_APPLE_RELEASE',
  'PENDING_DEVELOPER_RELEASE',
  'READY_FOR_SALE',
  'PROCESSING_FOR_APP_STORE',
])

async function submitForReview(versionId, versionState) {
  if (REVIEW_DONE_STATES.has(versionState)) {
    console.log(`ℹ️ Version artıq review/release axınındadır: ${versionState}`)
    return { skipped: true, state: versionState }
  }

  const existing = await asc(
    'GET',
    `apps/${appId}/reviewSubmissions?filter[platform]=IOS&filter[state]=READY_FOR_REVIEW,WAITING_FOR_REVIEW,IN_REVIEW&limit=10`
  )

  let submission =
    (existing.data ?? []).find((s) => s.attributes?.state === 'READY_FOR_REVIEW') ??
    (existing.data ?? []).find((s) =>
      ['WAITING_FOR_REVIEW', 'IN_REVIEW'].includes(s.attributes?.state)
    )

  if (submission && ['WAITING_FOR_REVIEW', 'IN_REVIEW'].includes(submission.attributes.state)) {
    console.log(`ℹ️ Review submission artıq göndərilib: ${submission.attributes.state}`)
    return { skipped: true, state: submission.attributes.state, id: submission.id }
  }

  if (!submission) {
    const created = await asc('POST', 'reviewSubmissions', {
      data: {
        type: 'reviewSubmissions',
        attributes: { platform: 'IOS' },
        relationships: {
          app: { data: { type: 'apps', id: appId } },
        },
      },
    })
    submission = created.data
    console.log(`✅ Review submission yaradıldı: ${submission.id}`)
  } else {
    console.log(`ℹ️ Mövcud READY_FOR_REVIEW submission: ${submission.id}`)
  }

  // Attach version if needed
  const items = await asc('GET', `reviewSubmissions/${submission.id}/items`)
  const alreadyAttached = (items.data ?? []).some(
    (item) => item.relationships?.appStoreVersion?.data?.id === versionId
  )
  if (!alreadyAttached) {
    await asc('POST', 'reviewSubmissionItems', {
      data: {
        type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: {
            data: { type: 'reviewSubmissions', id: submission.id },
          },
          appStoreVersion: {
            data: { type: 'appStoreVersions', id: versionId },
          },
        },
      },
    })
    console.log('✅ Version review submission-a əlavə olundu')
  }

  const submitted = await asc('PATCH', `reviewSubmissions/${submission.id}`, {
    data: {
      type: 'reviewSubmissions',
      id: submission.id,
      attributes: { submitted: true },
    },
  })

  const state = submitted.data?.attributes?.state
  console.log(`🚀 App Review-ə göndərildi: ${state}`)
  return { skipped: false, state, id: submission.id }
}

async function main() {
  console.log(
    JSON.stringify(
      {
        appId,
        appVersion,
        buildNumber,
        releaseType,
      },
      null,
      2
    )
  )

  const build = await waitForBuild()
  const version = await ensureAppStoreVersion()
  const versionId = version.id
  let versionState = version.attributes?.appStoreState
  console.log(`App Store version ${versionId} state=${versionState}`)

  if (!REVIEW_DONE_STATES.has(versionState)) {
    await attachBuild(versionId, build.id)
    await setAutoRelease(versionId)
    await setEncryption(build.id)
    await setWhatsNew(versionId)
  } else {
    // Still ensure auto-release if pending developer release somehow
    if (versionState === 'PENDING_DEVELOPER_RELEASE') {
      console.log('⚠️ PENDING_DEVELOPER_RELEASE — AFTER_APPROVAL artıq keçib; manual release lazım ola bilər')
    }
  }

  const result = await submitForReview(versionId, versionState)
  console.log(`✅ ASC App Review göndərildi (releaseType=${releaseType})`, result)
}

main().catch((error) => {
  console.error('❌ ASC submit-for-review failed')
  console.error(error.message)
  if (error.payload) {
    console.error(JSON.stringify(error.payload, null, 2))
  }
  process.exit(1)
})
