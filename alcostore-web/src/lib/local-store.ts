'use client'

import { useSyncExternalStore } from 'react'

/**
 * localStorage üçün kiçik reaktiv qat (useSyncExternalStore ilə).
 * Server render-də dəyər `undefined`-dir — "hələ bilinmir" vəziyyəti (hydration uyğunluğu üçün).
 */
const listeners = new Map<string, Set<() => void>>()

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l())
}

export function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeLocal(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* private mode */
  }
  emit(key)
}

function subscribe(key: string, cb: () => void) {
  let set = listeners.get(key)
  if (!set) listeners.set(key, (set = new Set()))
  set.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === key) cb()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    set!.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

export function useLocalValue(key: string): string | null | undefined {
  return useSyncExternalStore(
    (cb) => subscribe(key, cb),
    () => readLocal(key),
    () => undefined,
  )
}
