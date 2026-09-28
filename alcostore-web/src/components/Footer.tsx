import Image from 'next/image'
import Link from 'next/link'
import { LEGAL_NOTICE, RESPONSIBLE_NOTICE, whatsappUrl, type StoreSettings } from '@alcostore/shared'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/config'

export function Footer({ settings }: { settings: StoreSettings }) {
  return (
    <footer className="mt-24 border-t border-line bg-bar">
      <div className="mx-auto grid max-w-[1328px] gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-14">
        <div className="flex gap-4">
          <Image src="/logo.png" alt="" width={56} height={56} className="h-14 w-14 rounded-full" />
          <div className="space-y-2 text-sm text-muted">
            <div className="font-semibold text-text">
              {settings.store_name} · {settings.delivery_area} · hər gün {settings.open_from}–{settings.open_to}
            </div>
            <p>{LEGAL_NOTICE}</p>
            <p>{RESPONSIBLE_NOTICE}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="kicker text-faint">Məlumat</div>
          <Link href="/support" className="block text-text3 hover:text-gold">Əlaqə və dəstək</Link>
          <Link href="/privacy" className="block text-text3 hover:text-gold">Məxfilik siyasəti</Link>
          <Link href="/terms" className="block text-text3 hover:text-gold">İstifadə şərtləri</Link>
          <Link href="/data-deletion" className="block text-text3 hover:text-gold">Məlumatların silinməsi</Link>
        </div>
        <div className="space-y-3 text-sm">
          <div className="kicker text-faint">Əlaqə</div>
          <a href={whatsappUrl(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-[12px] bg-wa px-4 font-semibold text-on-wa">
            WhatsApp-da yaz
          </a>
          <div className="text-text3">{settings.whatsapp_number}</div>
          {settings.instagram ? (
            <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="block text-text3 hover:text-gold">
              Instagram · @alcostore.baku
            </a>
          ) : null}
          {APP_STORE_URL || PLAY_STORE_URL ? (
            <div className="flex gap-2 pt-2">
              {APP_STORE_URL ? <a href={APP_STORE_URL} className="rounded-lg border border-line px-3 py-2 text-xs">App Store</a> : null}
              {PLAY_STORE_URL ? <a href={PLAY_STORE_URL} className="rounded-lg border border-line px-3 py-2 text-xs">Google Play</a> : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-faint">© {new Date().getFullYear()} {settings.store_name}</div>
    </footer>
  )
}
