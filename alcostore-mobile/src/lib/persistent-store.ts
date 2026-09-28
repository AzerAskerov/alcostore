import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSyncExternalStore } from 'react'

/**
 * AsyncStorage ilə saxlanan kiçik reaktiv store (səbət, sevimlilər, yaş təsdiqi).
 * `hydrate()` tətbiq açılanda bir dəfə çağırılır; o vaxta qədər `ready = false`.
 */
export function createPersistentStore<T>(key: string, initial: T) {
  let state = initial
  let ready = false
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())

  const store = {
    get: () => state,
    isReady: () => ready,
    set(next: T | ((prev: T) => T)) {
      state = typeof next === 'function' ? (next as (p: T) => T)(state) : next
      emit()
      AsyncStorage.setItem(key, JSON.stringify(state)).catch(() => {})
    },
    async hydrate() {
      try {
        const raw = await AsyncStorage.getItem(key)
        if (raw !== null) state = JSON.parse(raw) as T
      } catch {
        /* korlanmış data — defolt */
      }
      ready = true
      emit()
    },
    subscribe(cb: () => void) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    use(): T {
      return useSyncExternalStore(store.subscribe, store.get, store.get)
    },
    useReady(): boolean {
      return useSyncExternalStore(store.subscribe, store.isReady, store.isReady)
    },
  }
  return store
}
