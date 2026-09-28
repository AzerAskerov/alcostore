'use client'

import Link from 'next/link'
import { formatPrice, type AdminStats, type Order } from '@alcostore/shared'
import { Card, ErrorNote, PageTitle } from '@/components/admin/AdminShell'
import { adminApi } from '@/lib/admin-api'
import { useLoad } from '@/lib/use-load'

export default function AdminDashboard() {
  const stats = useLoad(() => adminApi.get<AdminStats>('/stats'))
  const overview = useLoad(() => adminApi.get<{ recent_orders: Order[] }>('/overview'))
  const s = stats.data

  const tiles = s
    ? [
        ['Bu gün sifariş', s.orders_today],
        ['Ümumi sifariş', s.orders_total],
        ['Aktiv məhsul', `${s.active_products} / ${s.products}`],
        ['Cihaz (push)', `${s.push_devices} / ${s.devices}`],
      ]
    : []

  return (
    <div className="space-y-6">
      <PageTitle title="İcmal" />
      <ErrorNote error={stats.error} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(([k, v]) => (
          <Card key={String(k)}>
            <div className="text-xs text-muted">{k}</div>
            <div className="mt-1 text-3xl font-bold text-gold">{v}</div>
          </Card>
        ))}
      </div>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Son sifarişlər</h2>
          <Link href="/admin/orders" className="text-sm text-gold">Hamısı</Link>
        </div>
        {overview.data?.recent_orders.length ? (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-line">
              {overview.data.recent_orders.map((o) => (
                <tr key={o.id}>
                  <td className="py-2 font-mono">{o.code}</td>
                  <td className="py-2 text-muted">{o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</td>
                  <td className="py-2 text-right font-semibold text-gold">{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted">Hələ sifariş yoxdur.</p>
        )}
      </Card>
    </div>
  )
}
