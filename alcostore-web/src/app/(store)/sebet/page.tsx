import type { Metadata } from 'next'
import { CartView } from '@/components/CartView'
import { api } from '@/lib/api'

export const metadata: Metadata = { title: 'Səbət', robots: { index: false } }

export default async function CartPage() {
  const settings = await api.settings()
  return (
    <div className="py-10">
      <h1 className="font-serif text-5xl">Səbət</h1>
      <CartView settings={settings} />
    </div>
  )
}
