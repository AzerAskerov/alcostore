'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { API_URL, APP_ENV, TELEGRAM_BOT_USERNAME } from '@/lib/config'
import { setToken } from '@/lib/admin-api'

interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void
  }
}

const ERRORS: Record<string, string> = {
  invalid: 'Telegram imzası yanlışdır.',
  expired: 'Giriş vaxtı keçib, yenidən cəhd edin.',
  unauthorized: 'Bu Telegram hesabının admin icazəsi yoxdur.',
}

export default function AdminLoginPage() {
  const router = useRouter()
  const widgetRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const finish = async (path: string, body: unknown) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/admin/auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { token?: string; error?: string }
      if (!res.ok || !data.token) throw new Error(ERRORS[data.error ?? ''] ?? data.error ?? 'Giriş alınmadı')
      setToken(data.token)
      router.replace('/admin')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Giriş alınmadı')
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!TELEGRAM_BOT_USERNAME || !widgetRef.current) return
    window.onTelegramAuth = (user) => finish('telegram', user)
    const s = document.createElement('script')
    s.src = 'https://telegram.org/js/telegram-widget.js?22'
    s.async = true
    s.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME)
    s.setAttribute('data-size', 'large')
    s.setAttribute('data-radius', '12')
    s.setAttribute('data-onauth', 'onTelegramAuth(user)')
    s.setAttribute('data-request-access', 'write')
    widgetRef.current.innerHTML = ''
    widgetRef.current.appendChild(s)
    return () => {
      delete window.onTelegramAuth
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-[20px] border border-line bg-bar p-8 text-center">
        <Image src="/logo.png" alt="" width={80} height={80} className="mx-auto rounded-full" />
        <h1 className="mt-5 font-serif text-3xl">Admin panel</h1>
        <p className="mt-2 text-sm text-muted">Telegram hesabınızla daxil olun</p>
        <div ref={widgetRef} className="mt-6 flex min-h-12 justify-center" />
        {!TELEGRAM_BOT_USERNAME ? (
          <p className="mt-4 text-xs text-faint">NEXT_PUBLIC_TELEGRAM_BOT_USERNAME təyin olunmayıb.</p>
        ) : null}
        {APP_ENV === 'local' ? (
          <button
            disabled={busy}
            onClick={() => finish('dev', {})}
            className="mt-6 h-11 w-full rounded-[12px] border border-line-strong text-sm text-text3 hover:border-gold"
          >
            Local giriş (yalnız development)
          </button>
        ) : null}
        {error ? <p className="mt-4 text-sm text-red">{error}</p> : null}
      </div>
    </div>
  )
}
