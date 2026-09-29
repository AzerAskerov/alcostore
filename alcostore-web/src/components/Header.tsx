'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MessageCircle, Search, ShoppingBag } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { whatsappUrl, type Category, type StoreSettings } from '@alcostore/shared'
import { useCart } from '@/lib/cart'

export function Header({ settings, categories }: { settings: StoreSettings; categories: Category[] }) {
  const { count, ready } = useCart()
  const router = useRouter()
  const pathname = usePathname()
  const activeSlug = pathname.startsWith('/kateqoriya/') ? decodeURIComponent(pathname.split('/')[2] ?? '') : null
  const mobileNavRef = useRef<HTMLElement>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    const el = mobileNavRef.current?.querySelector<HTMLElement>('[aria-current="page"]')
    el?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [activeSlug])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bar/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1328px] items-center gap-4 px-4 py-3 md:gap-8 md:px-14 md:py-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image src="/logo.png" alt={settings.store_name} width={48} height={48} className="h-10 w-10 rounded-full md:h-12 md:w-12" priority />
          <div className="leading-tight">
            <div className="text-[15px] font-bold uppercase tracking-wide md:text-[17px]">{settings.store_name}</div>
            <div className="kicker text-[9px] text-red md:text-[10px]">Şərab evi · Bakı</div>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center gap-6 text-sm text-text3 lg:flex">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/kateqoriya/${c.slug}`}
              aria-current={c.slug === activeSlug ? 'page' : undefined}
              className={`transition hover:text-gold ${c.slug === activeSlug ? 'font-semibold text-gold' : ''}`}
            >
              {c.name_az}
            </Link>
          ))}
        </nav>

        <form
          className="ml-auto hidden md:block"
          onSubmit={(e) => {
            e.preventDefault()
            if (q.trim()) router.push(`/axtaris?q=${encodeURIComponent(q.trim())}`)
          }}
        >
          <label className="flex h-11 w-[240px] items-center gap-2 rounded-[12px] border border-line bg-surface px-3 text-sm xl:w-[280px]">
            <Search size={16} className="text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Axtar…"
              className="w-full bg-transparent text-text placeholder:text-faint focus:outline-none"
              aria-label="Məhsul axtar"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link href="/axtaris" className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-line md:hidden" aria-label="Axtarış">
            <Search size={18} />
          </Link>
          <a
            href={whatsappUrl(settings.whatsapp_number)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-11 items-center gap-2 rounded-[12px] bg-wa px-4 text-sm font-semibold text-on-wa sm:flex"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
          <Link
            href="/sebet"
            className="flex h-11 items-center gap-2 rounded-[12px] border border-gold/50 px-3 text-sm font-semibold text-gold md:px-4"
          >
            <ShoppingBag size={16} />
            <span className="hidden md:inline">Səbət</span>
            {ready && count > 0 ? <span className="rounded-full bg-red px-1.5 text-xs text-on-red">{count}</span> : null}
          </Link>
        </div>
      </div>
      <nav ref={mobileNavRef} className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/kateqoriya/${c.slug}`}
            aria-current={c.slug === activeSlug ? 'page' : undefined}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${c.slug === activeSlug ? 'bg-red text-on-red' : 'border border-line text-text3'}`}
          >
            {c.name_az}
          </Link>
        ))}
      </nav>
    </header>
  )
}
