import { AgeGate } from '@/components/AgeGate'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { api } from '@/lib/api'

export const dynamic = 'force-dynamic'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([api.settings(), api.categories()])
  return (
    <>
      <Header settings={settings} categories={categories} />
      <main className="mx-auto min-h-[60vh] max-w-[1328px] px-4 md:px-14">{children}</main>
      <Footer settings={settings} />
      <AgeGate storeName={settings.store_name} />
    </>
  )
}
