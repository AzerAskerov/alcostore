import { HTTPException } from 'hono/http-exception'

export function badRequest(message: string): never {
  throw new HTTPException(400, { message })
}

export function notFound(message = 'Tapılmadı'): never {
  throw new HTTPException(404, { message })
}

export function toInt(v: unknown, fallback?: number): number | undefined {
  if (v === undefined || v === null || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

export function toNum(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function reqString(body: Record<string, unknown>, key: string, max = 500): string {
  const v = body[key]
  if (typeof v !== 'string' || !v.trim()) badRequest(`"${key}" tələb olunur`)
  if (v.length > max) badRequest(`"${key}" çox uzundur`)
  return v.trim()
}

export function optString(body: Record<string, unknown>, key: string, max = 5000): string | null {
  const v = body[key]
  if (v === undefined || v === null) return null
  if (typeof v !== 'string') badRequest(`"${key}" mətn olmalıdır`)
  if (v.length > max) badRequest(`"${key}" çox uzundur`)
  return v.trim() || null
}

export function bool(v: unknown): 0 | 1 {
  return v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0
}

export async function readJson(req: { json: () => Promise<unknown> }): Promise<Record<string, unknown>> {
  try {
    const body = await req.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) badRequest('JSON obyekt gözlənilir')
    return body as Record<string, unknown>
  } catch (e) {
    if (e instanceof HTTPException) throw e
    badRequest('Yanlış JSON')
  }
}
