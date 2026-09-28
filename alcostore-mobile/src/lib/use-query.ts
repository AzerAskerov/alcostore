import { useCallback, useEffect, useRef, useState } from 'react'

/** Sadə fetch hook-u: `key` dəyişəndə yenidən yükləyir, `refresh()` pull-to-refresh üçün. */
export function useQuery<T>(loader: () => Promise<T>, key = '') {
  const [tick, setTick] = useState(0)
  const [state, setState] = useState<{ k: string; data: T | null; error: string | null }>({ k: '', data: null, error: null })
  const [refreshing, setRefreshing] = useState(false)
  const loaderRef = useRef(loader)
  useEffect(() => {
    loaderRef.current = loader
  })

  const reqKey = `${key}#${tick}`
  useEffect(() => {
    let alive = true
    loaderRef.current().then(
      (data) => {
        if (!alive) return
        setState({ k: reqKey, data, error: null })
        setRefreshing(false)
      },
      (e: unknown) => {
        if (!alive) return
        setState((s) => ({ k: reqKey, data: s.data, error: e instanceof Error ? e.message : 'Xəta' }))
        setRefreshing(false)
      },
    )
    return () => {
      alive = false
    }
  }, [reqKey])

  const refresh = useCallback(() => {
    setRefreshing(true)
    setTick((t) => t + 1)
  }, [])

  return { data: state.data, error: state.error, loading: state.k !== reqKey && !state.data, refreshing, refresh }
}
