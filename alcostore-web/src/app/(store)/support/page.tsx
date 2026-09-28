import type { Metadata } from 'next'
import { whatsappUrl } from '@alcostore/shared'
import { LegalPage } from '@/components/LegalPage'
import { api } from '@/lib/api'

export const metadata: Metadata = { title: 'Əlaqə və dəstək', alternates: { canonical: '/support' } }

export default async function SupportPage() {
  const s = await api.settings()
  return (
    <LegalPage title="Əlaqə və dəstək" updated="28.09.2026">
      <p>Sifariş, çatdırılma və ya tətbiqlə bağlı sualınız varsa bizə yazın.</p>
      <ul>
        <li>
          WhatsApp: <a href={whatsappUrl(s.whatsapp_number)}>{s.whatsapp_number}</a>
        </li>
        <li>
          Telefon: <a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a>
        </li>
        <li>
          E-poçt: <a href={`mailto:${s.support_email}`}>{s.support_email}</a>
        </li>
        <li>Ünvan: {s.address}</li>
        <li>
          İş saatları: hər gün {s.open_from}–{s.open_to}
        </li>
        {s.instagram ? (
          <li>
            Instagram: <a href={s.instagram}>@alcostore.baku</a>
          </li>
        ) : null}
      </ul>
      <h2>Tez-tez verilən suallar</h2>
      <p>
        <b>Sifarişi necə verim?</b> Məhsulları səbətə atın və “Sifarişi WhatsApp-a göndər” düyməsini basın. Hazır mətn
        WhatsApp-da açılacaq — ünvanınızı yazıb göndərin.
      </p>
      <p>
        <b>Ödəniş necədir?</b> Ödəniş çatdırılma zamanı edilir. Detallar WhatsApp-da təsdiqlənir.
      </p>
      <p>
        <b>Bildirişləri necə söndürüm?</b> Tətbiqdə Profil → Bildirişlər və ya telefonun ayarlarından.
      </p>
    </LegalPage>
  )
}
