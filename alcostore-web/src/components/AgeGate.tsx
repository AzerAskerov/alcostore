'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { AGE_GATE_STORAGE_KEY, LEGAL_NOTICE, MIN_AGE } from '@alcostore/shared'
import { useLocalValue, writeLocal } from '@/lib/local-store'

/** 18+ təsdiqi. Seçim brauzerdə yadda saxlanır. Məzmun HTML-də qalır (SEO), yalnız üstü örtülür. */
export function AgeGate({ storeName }: { storeName: string }) {
  const stored = useLocalValue(AGE_GATE_STORAGE_KEY)
  const [denied, setDenied] = useState(false)
  const confirmed = stored === '1'
  const blocking = stored !== undefined && !confirmed

  useEffect(() => {
    document.body.style.overflow = blocking ? 'hidden' : ''
  }, [blocking])

  if (!blocking) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-page/95 p-4 backdrop-blur" role="dialog" aria-modal="true" aria-labelledby="age-title">
      <div className="w-full max-w-md rounded-[20px] border border-line bg-surface p-8 text-center">
        <Image src="/logo.png" alt={storeName} width={96} height={96} className="mx-auto mb-6 h-24 w-24 rounded-full" />
        {!denied ? (
          <>
            <div className="kicker mb-3 text-red">{MIN_AGE}+</div>
            <h2 id="age-title" className="font-serif text-3xl">{MIN_AGE} yaşınız tamam olub?</h2>
            <p className="mt-3 text-sm text-muted">{LEGAL_NOTICE} Sayta daxil olmaq üçün yaşınızı təsdiqləyin.</p>
            <div className="mt-8 flex flex-col gap-3">
              <button onClick={() => writeLocal(AGE_GATE_STORAGE_KEY, '1')} className="glow-red h-14 rounded-[14px] bg-red font-semibold text-on-red">
                Bəli, {MIN_AGE} yaşım var
              </button>
              <button onClick={() => setDenied(true)} className="h-12 rounded-[14px] border border-line text-text3">
                Xeyr
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="age-title" className="font-serif text-3xl">Təəssüf ki, daxil ola bilməzsiniz</h2>
            <p className="mt-3 text-sm text-muted">Bu sayt yalnız {MIN_AGE} yaşdan yuxarı şəxslər üçündür.</p>
            <button onClick={() => setDenied(false)} className="mt-8 h-12 w-full rounded-[14px] border border-line text-text3">
              Geri
            </button>
          </>
        )}
      </div>
    </div>
  )
}
