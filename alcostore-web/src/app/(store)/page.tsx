import Link from 'next/link'
import { isStoreOpen, whatsappUrl } from '@alcostore/shared'
import { ProductCard } from '@/components/ProductCard'
import { ProductImage } from '@/components/ProductImage'
import { api } from '@/lib/api'

export default async function HomePage() {
  const [home, catalog] = await Promise.all([api.home(), api.products({ sort: 'popular', page_size: 8 })])
  const { settings, categories, banners } = home
  const open = isStoreOpen(settings.open_from, settings.open_to)
  const total = categories.reduce((s, c) => s + (c.product_count ?? 0), 0)

  return (
    <>
      {/* Hero */}
      <section className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-16">
        <div>
          <div className="kicker text-red">
            {settings.delivery_area} · {settings.delivery_text.replace(/^Bakı daxili,\s*/i, '')} çatdırılma
          </div>
          <h1 className="mt-4 font-serif text-[44px] leading-[1.02] md:text-[62px]">
            Kataloqdan seç, sifarişi <em className="text-gold">WhatsApp</em>-da tamamla
          </h1>
          <p className="mt-5 max-w-xl text-text3">
            {total} məhsul: {categories.map((c) => c.name_az.toLowerCase()).join(', ')}. Qiymətlər saytda açıq
            göstərilir, sifariş bir düymə ilə WhatsApp-a keçir.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="#kataloq" className="glow-red inline-flex h-14 items-center rounded-[14px] bg-red px-7 font-semibold text-on-red">
              Kataloqa bax
            </Link>
            <a
              href={whatsappUrl(settings.whatsapp_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center rounded-[14px] border border-line px-6 text-text3"
            >
              {settings.whatsapp_number}
            </a>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${open ? 'bg-wa' : 'bg-faint'}`} />
            <span className={open ? 'text-text3' : 'text-muted'}>
              {open ? 'İndi açıqdır' : 'Hazırda bağlıdır'} · hər gün {settings.open_from}–{settings.open_to}
            </span>
          </div>
        </div>
        <div className="relative h-[260px] overflow-hidden rounded-[18px] border border-line md:h-[420px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/store-front.jpg" alt={`${settings.store_name} mağazası — ${settings.address}`} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5">
            <div className="kicker text-gold">Mağaza</div>
            <div className="text-sm text-text2">{settings.address}</div>
          </div>
        </div>
      </section>

      {/* Banners */}
      {banners.length ? (
        <section className="grid gap-4 md:grid-cols-2">
          {banners.map((b) => (
            <Link key={b.id} href={b.link || '#kataloq'} className="promo relative flex min-h-[180px] overflow-hidden rounded-[16px] transition hover:brightness-110">
              {b.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
              ) : null}
              <div className="relative mt-auto w-full bg-gradient-to-t from-black/85 to-transparent p-6">
                {b.kicker ? <div className="kicker text-red">{b.kicker}</div> : null}
                <div className="mt-2 font-serif text-3xl">{b.title}</div>
                {b.subtitle ? <div className="mt-1 text-sm text-text3">{b.subtitle}</div> : null}
              </div>
            </Link>
          ))}
        </section>
      ) : null}

      {/* Catalog */}
      <section id="kataloq" className="scroll-mt-28 pt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-serif text-4xl md:text-5xl">Kataloq</h2>
          <div className="scrollbar-none flex max-w-full gap-2 overflow-x-auto">
            <span className="shrink-0 rounded-full bg-red px-4 py-1.5 text-sm text-on-red">Hamısı</span>
            {categories.map((c) => (
              <Link key={c.id} href={`/kateqoriya/${c.slug}`} className="shrink-0 rounded-full border border-line px-4 py-1.5 text-sm text-text3 hover:border-gold hover:text-gold">
                {c.name_az}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {catalog.items.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="pt-16">
        <h2 className="font-serif text-4xl">Kateqoriyalar</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.id} href={`/kateqoriya/${c.slug}`} className="group overflow-hidden rounded-[16px] border border-line bg-surface hover:border-gold/50">
              <div className="aspect-[4/5] overflow-hidden bg-surface2">
                <ProductImage url={c.image_url} category={c.slug} name={c.name_az} className="transition duration-300 group-hover:scale-[1.04]" />
              </div>
              <div className="p-3">
                <div className="font-medium group-hover:text-gold">{c.name_az}</div>
                <div className="font-mono text-xs text-muted">{c.product_count} məhsul</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
