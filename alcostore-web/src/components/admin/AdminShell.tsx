'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Image as ImageIcon, LayoutDashboard, LogOut, Package, Settings, ShoppingCart, Tags } from 'lucide-react'
import { useEffect } from 'react'
import { setToken, TOKEN_KEY } from '@/lib/admin-api'
import { useLocalValue } from '@/lib/local-store'

const NAV = [
  { href: '/admin', label: 'İcmal', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Sifarişlər', icon: ShoppingCart },
  { href: '/admin/products', label: 'Məhsullar', icon: Package },
  { href: '/admin/categories', label: 'Kateqoriyalar', icon: Tags },
  { href: '/admin/banners', label: 'Bannerlər', icon: ImageIcon },
  { href: '/admin/notifications', label: 'Bildirişlər', icon: Bell },
  { href: '/admin/settings', label: 'Ayarlar', icon: Settings },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLogin = pathname.startsWith('/admin/login')
  const token = useLocalValue(TOKEN_KEY)

  useEffect(() => {
    if (!isLogin && token === null) router.replace('/admin/login')
  }, [isLogin, token, router])

  if (isLogin) return <div className="admin min-h-screen bg-page">{children}</div>
  if (!token) return <div className="min-h-screen bg-page" />

  return (
    <div className="admin flex min-h-screen bg-page">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-bar p-4 md:flex">
        <Link href="/admin" className="mb-8 flex items-center gap-3">
          <Image src="/logo.png" alt="" width={36} height={36} className="rounded-full" />
          <div>
            <div className="text-sm font-bold">ALCO STORE</div>
            <div className="kicker text-[9px] text-red">Admin</div>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm ${active ? 'bg-surface2 text-gold' : 'text-text3 hover:bg-surface'}`}
              >
                <Icon size={16} /> {label}
              </Link>
            )
          })}
        </nav>
        <button
          onClick={() => setToken(null)}
          className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-muted hover:text-red"
        >
          <LogOut size={16} /> Çıxış
        </button>
      </aside>
      <div className="min-w-0 flex-1">
        <nav className="scrollbar-none flex gap-1 overflow-x-auto border-b border-line bg-bar p-2 md:hidden">
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} className={`shrink-0 rounded-lg px-3 py-1.5 text-sm ${pathname === href ? 'bg-surface2 text-gold' : 'text-text3'}`}>
              {label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}

export function PageTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-serif text-4xl">{title}</h1>
      {action}
    </div>
  )
}

export function Btn({
  children,
  variant = 'primary',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const cls = {
    primary: 'bg-red text-on-red hover:brightness-110',
    ghost: 'border border-line-strong text-text3 hover:border-gold hover:text-gold',
    danger: 'border border-red/50 text-red hover:bg-red/10',
  }[variant]
  return (
    <button {...rest} className={`inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-semibold transition disabled:opacity-50 ${cls} ${rest.className ?? ''}`}>
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[14px] border border-line bg-bar p-5 ${className}`}>{children}</div>
}

export function ErrorNote({ error }: { error: string | null }) {
  return error ? <div className="rounded-[10px] border border-red/40 bg-red/10 px-4 py-2 text-sm text-red">{error}</div> : null
}
