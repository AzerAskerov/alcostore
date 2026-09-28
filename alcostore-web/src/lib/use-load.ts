'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Admin səhifələri üçün sadə data yükləyici.
 * `key` dəyişəndə (filtr, səhifə) yenidən yükləyir; `reload()` əl ilə yeniləyir.
 */
export function useLoad<T>(loader: () => Promise<T>, key = '') {
  const [tick, setTick] = useState(0)
  const [state, setState] = useState<{ k: string; data: T | null; error: string | null }>({ k: '', data: null, error: null })
  const loaderRef = useRef(loader)
  useEffect(() => {
    loaderRef.current = loader
  })

  const reqKey = `${key}#${tick}`
  useEffect(() => {
    let alive = true
    loaderRef.current().then(
      (data) => alive && setState({ k: reqKey, data, error: null }),
      (e: unknown) => alive && setState((s) => ({ k: reqKey, data: s.data, error: e instanceof Error ? e.message : 'Xəta' })),
    )
    return () => {
      alive = false
    }
  }, [reqKey])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data: state.data, error: state.error, loading: state.k !== reqKey, reload }
}
