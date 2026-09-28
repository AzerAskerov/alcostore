/**
 * Telegram: admin girişinin yoxlanması (Login Widget) və admin-lərə bildiriş.
 * https://core.telegram.org/widgets/login#checking-authorization
 */

export interface TelegramAuthData {
  id: string
  auth_date: string
  hash: string
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
}

const TELEGRAM_FIELDS = ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date'] as const

export function pickTelegramFields(query: Record<string, string | undefined>): TelegramAuthData {
  const data: TelegramAuthData = { id: query.id ?? '', auth_date: query.auth_date ?? '', hash: query.hash ?? '' }
  for (const f of TELEGRAM_FIELDS) {
    const v = query[f]
    if (v !== undefined && f !== 'id' && f !== 'auth_date') data[f] = v
  }
  return data
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

export async function verifyTelegramAuth(data: TelegramAuthData, botToken: string): Promise<boolean> {
  if (!data.hash || !data.id || !data.auth_date || !botToken) return false
  const checkString = Object.entries(data)
    .filter(([k, v]) => k !== 'hash' && v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n')
  const enc = new TextEncoder()
  const secret = await crypto.subtle.digest('SHA-256', enc.encode(botToken))
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(checkString))
  return timingSafeEqual(toHex(sig), data.hash.toLowerCase())
}

export function parseAdminIds(raw: string | undefined): string[] {
  return (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function sendTelegramMessage(botToken: string, chatId: string, html: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true }),
    })
    if (!res.ok) console.error('[telegram] sendMessage failed', res.status, await res.text())
    return res.ok
  } catch (e) {
    console.error('[telegram] sendMessage error', e)
    return false
  }
}

/** Sifariş bildirişi: TELEGRAM_ORDERS_CHAT_ID varsa ora, yoxdursa hər admin-ə şəxsən. */
export async function notifyOrderChannel(
  env: { TELEGRAM_BOT_TOKEN?: string; TELEGRAM_ORDERS_CHAT_ID?: string; ADMIN_TELEGRAM_IDS?: string },
  html: string,
): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN) return
  const targets = env.TELEGRAM_ORDERS_CHAT_ID ? [env.TELEGRAM_ORDERS_CHAT_ID] : parseAdminIds(env.ADMIN_TELEGRAM_IDS)
  await Promise.allSettled(targets.map((id) => sendTelegramMessage(env.TELEGRAM_BOT_TOKEN!, id, html)))
}
