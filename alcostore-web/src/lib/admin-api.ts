'use client'

import { API_URL } from './config'
import { readLocal, writeLocal } from './local-store'

export const TOKEN_KEY = 'alcostore.admin.token'

export function getToken(): string | null {
  return readLocal(TOKEN_KEY)
}

/** Token silinəndə AdminShell (useLocalValue ilə) avtomatik login səhifəsinə yönləndirir. */
export function setToken(token: string | null) {
  writeLocal(TOKEN_KEY, token)
}

export class AdminApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  const res = await fetch(`${API_URL}/admin${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  })
  if (res.status === 401) {
    setToken(null)
    throw new AdminApiError(401, 'Giriş tələb olunur')
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new AdminApiError(res.status, data.error || `Xəta ${res.status}`)
  return data
}

export const adminApi = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b?: unknown) => request<T>('POST', p, b ?? {}),
  put: <T>(p: string, b: unknown) => request<T>('PUT', p, b),
  patch: <T>(p: string, b: unknown) => request<T>('PATCH', p, b),
  del: <T>(p: string) => request<T>('DELETE', p),
  upload: <T>(p: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return request<T>('POST', p, fd)
  },
}
