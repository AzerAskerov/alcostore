import type { Metadata } from 'next'
import { whatsappUrl } from '@alcostore/shared'
import { LegalPage } from '@/components/LegalPage'
import { api } from '@/lib/api'

export const metadata: Metadata = { title: 'Məlumatların silinməsi', alternates: { canonical: '/data-deletion' } }

export default async function DataDeletionPage() {
  const s = await api.settings()
  return (
    <LegalPage title="Məlumatların silinməsi" updated="28.09.2026">
      <p>{s.store_name} tətbiqində hesab yoxdur, ona görə “hesabı sil” addımı da yoxdur. Saxlanan məlumatlar:</p>
      <ul>
        <li>anonim cihaz ID-si və push tokeni;</li>
        <li>göndərdiyiniz sifarişlərin tərkibi.</li>
      </ul>
      <h2>Necə silmək olar</h2>
      <ul>
        <li>
          <b>Push tokeni:</b> tətbiqdə Profil → Bildirişlər açarını söndürün və ya tətbiqi silin — token dərhal
          etibarsız olur.
        </li>
        <li>
          <b>Bütün məlumatlar:</b> tətbiqdə Profil → “Məlumatlarımı sil” bölməsindəki cihaz ID-ni bizə{' '}
          <a href={whatsappUrl(s.whatsapp_number, 'Salam, cihaz məlumatlarımın silinməsini istəyirəm. Cihaz ID: ')}>WhatsApp</a>{' '}
          və ya <a href={`mailto:${s.support_email}?subject=Data%20deletion`}>{s.support_email}</a> ünvanına göndərin.
          Sorğu 30 gün ərzində icra olunur.
        </li>
      </ul>
      <p>WhatsApp yazışmaları WhatsApp-ın öz məxfilik qaydalarına tabedir.</p>
    </LegalPage>
  )
}
