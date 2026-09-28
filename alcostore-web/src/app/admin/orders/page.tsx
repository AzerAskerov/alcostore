'use client'

import { useState } from 'react'
import { formatPrice, formatVolume, type Order, type OrderStatus, type Paginated } from '@alcostore/shared'
import { Btn, Card, ErrorNote, PageTitle } from '@/components/admin/AdminShell'
import { adminApi } from '@/lib/admin-api'
import { useLoad } from '@/lib/use-load'

const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  new: { label: 'Yeni', cls: 'bg-red/15 text-red' },
  confirmed: { label: 'Təsdiqləndi', cls: 'bg-gold/15 text-gold' },
  delivered: { label: 'Çatdırıldı', cls: 'bg-wa/15 text-wa' },
  cancelled: { label: 'Ləğv', cls: 'bg-surface2 text-faint' },
}
const SRC = { ios: 'iOS', android: 'Android', web: 'Veb' }

function bakuTime(utc: string) {
  const d = new Date(utc.replace(' ', 'T') + 'Z')
  return d.toLocaleString('az-AZ', { timeZone: 'Asia/Baku', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [page, setPage] = useState(1)
  const { data, error, reload } = useLoad(
    () => adminApi.get<Paginated<Order>>(`/orders?page=${page}${status ? `&status=${status}` : ''}`),
    `${status}|${page}`,
  )
  const [err, setErr] = useState<string | null>(null)

  const update = async (id: number, s: OrderStatus) => {
    setErr(null)
    try {
      await adminApi.patch(`/orders/${id}`, { status: s })
      reload()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xəta')
    }
  }

  const pages = data ? Math.ceil(data.total / data.page_size) : 1

  return (
    <div className="space-y-4">
      <PageTitle title="Sifarişlər" />
      <p className="text-sm text-muted">
        Müştəri “WhatsApp-a göndər” basanda sifariş burada görünür. Yekun təsdiq WhatsApp-da olur — statusu buradan izləyin.
      </p>
      <div className="flex flex-wrap gap-2">
        {(['', 'new', 'confirmed', 'delivered', 'cancelled'] as const).map((s) => (
          <button
            key={s || 'all'}
            onClick={() => {
              setStatus(s)
              setPage(1)
            }}
            className={`rounded-full px-4 py-1.5 text-sm ${status === s ? 'bg-red text-on-red' : 'border border-line text-text3'}`}
          >
            {s ? STATUS[s].label : 'Hamısı'}
          </button>
        ))}
      </div>
      <ErrorNote error={error || err} />
      <div className="space-y-3">
        {data?.items.map((o) => (
          <Card key={o.id}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono font-semibold">{o.code}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS[o.status].cls}`}>{STATUS[o.status].label}</span>
              <span className="text-xs text-muted">{SRC[o.source]} · {bakuTime(o.created_at)}</span>
              <span className="ml-auto text-lg font-bold text-gold">{formatPrice(o.total)}</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-text3">
              {o.items.map((i) => (
                <li key={i.id}>
                  {i.name} <span className="font-mono text-xs text-muted">{formatVolume(i.volume_ml, i.pack_size)}</span> × {i.qty} —{' '}
                  {formatPrice(i.line_total)}
                </li>
              ))}
            </ul>
            {o.note ? <p className="mt-2 text-sm text-muted">Qeyd: {o.note}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {(['confirmed', 'delivered', 'cancelled'] as OrderStatus[])
                .filter((s) => s !== o.status)
                .map((s) => (
                  <Btn key={s} variant={s === 'cancelled' ? 'danger' : 'ghost'} onClick={() => update(o.id, s)}>
                    {STATUS[s].label}
                  </Btn>
                ))}
            </div>
          </Card>
        ))}
        {data && !data.items.length ? <p className="text-muted">Sifariş yoxdur.</p> : null}
      </div>
      {pages > 1 ? (
        <div className="flex gap-2">
          <Btn variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</Btn>
          <span className="self-center text-sm text-muted">{page} / {pages}</span>
          <Btn variant="ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>›</Btn>
        </div>
      ) : null}
    </div>
  )
}
