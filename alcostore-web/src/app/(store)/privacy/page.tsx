import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { api } from '@/lib/api'

export const metadata: Metadata = { title: 'Məxfilik siyasəti', alternates: { canonical: '/privacy' } }

export default async function PrivacyPage() {
  const s = await api.settings()
  return (
    <LegalPage title="Məxfilik siyasəti" updated="28.09.2026">
      <p>
        Bu siyasət {s.store_name} mobil tətbiqi və {`alcostore.az`} saytı (bundan sonra “Xidmət”) tərəfindən hansı
        məlumatların toplandığını və necə istifadə olunduğunu izah edir.
      </p>
      <h2>Hesab tələb olunmur</h2>
      <p>Xidmətdən istifadə üçün qeydiyyat, ad, e-poçt və ya parol tələb olunmur.</p>
      <h2>Topladığımız məlumatlar</h2>
      <ul>
        <li>
          <b>Anonim cihaz identifikatoru</b> — tətbiq quraşdırılanda yaradılan təsadüfi ID. Sizin şəxsiyyətinizlə
          əlaqələndirilmir.
        </li>
        <li>
          <b>Push bildiriş tokeni</b> — yalnız bildirişlərə icazə versəniz. Kampaniya və yeniliklər haqqında bildiriş
          göndərmək üçün istifadə olunur.
        </li>
        <li>
          <b>Sifariş məlumatı</b> — “WhatsApp-a göndər” düyməsini basanda səbətdəki məhsullar, miqdar və məbləğ
          qeydə alınır ki, sifarişinizi emal edə bilək.
        </li>
        <li>Texniki məlumatlar: platforma (iOS/Android/veb), tətbiq versiyası, dil.</li>
      </ul>
      <h2>WhatsApp</h2>
      <p>
        Sifariş WhatsApp vasitəsilə tamamlanır. Ünvan, telefon və ödəniş detalları yalnız siz WhatsApp-da yazdıqda
        bizə çatır və WhatsApp-ın (Meta) öz məxfilik siyasətinə tabedir. Bu məlumatları yalnız sifarişin çatdırılması
        üçün istifadə edirik.
      </p>
      <h2>Nə etmirik</h2>
      <ul>
        <li>Məlumatlarınızı satmırıq və reklam şəbəkələri ilə paylaşmırıq.</li>
        <li>Sizi digər tətbiqlər və saytlar üzrə izləmirik (tracking yoxdur).</li>
        <li>Tətbiqdə ödəniş qəbul etmirik və kart məlumatı toplamırıq.</li>
      </ul>
      <h2>Yaş məhdudiyyəti</h2>
      <p>Xidmət yalnız 18 yaşdan yuxarı şəxslər üçündür. 18 yaşdan kiçiklərə spirtli içki satılmır.</p>
      <h2>Saxlama və silinmə</h2>
      <p>
        Cihaz və sifariş məlumatları xidmətin göstərilməsi üçün lazım olan müddətdə saxlanılır. Məlumatlarınızın
        silinməsi üçün <a href="/data-deletion">bu səhifəyə</a> baxın.
      </p>
      <h2>Əlaqə</h2>
      <p>
        Suallar üçün: <a href={`mailto:${s.support_email}`}>{s.support_email}</a>, WhatsApp {s.whatsapp_number}.
      </p>
      <h2>English summary</h2>
      <p>
        No account is required. We collect an anonymous device ID, an optional push notification token, and the
        contents of orders you choose to send (products, quantities, totals). Orders are completed over WhatsApp; we do
        not process payments or collect card data, do not track you across apps, and do not sell or share data with
        advertisers. The service is for adults 18+ only. Contact: {s.support_email}.
      </p>
    </LegalPage>
  )
}
