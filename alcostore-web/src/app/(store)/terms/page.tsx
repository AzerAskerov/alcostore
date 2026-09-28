import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { api } from '@/lib/api'

export const metadata: Metadata = { title: 'İstifadə şərtləri', alternates: { canonical: '/terms' } }

export default async function TermsPage() {
  const s = await api.settings()
  return (
    <LegalPage title="İstifadə şərtləri" updated="28.09.2026">
      <h2>1. Yaş</h2>
      <p>
        Xidmətdən yalnız 18 yaşı tamam olmuş şəxslər istifadə edə bilər. Çatdırılma zamanı kuryer şəxsiyyət vəsiqəsini
        yoxlamaq hüququna malikdir; 18 yaşdan kiçik və ya sərxoş vəziyyətdə olan şəxslərə sifariş təhvil verilmir.
      </p>
      <h2>2. Sifariş</h2>
      <p>
        Saytda və tətbiqdə göstərilən qiymətlər Azərbaycan manatı (₼) ilədir. Sifariş WhatsApp-da {s.store_name}
        əməkdaşı tərəfindən təsdiqləndikdən sonra qüvvəyə minir. Stok və qiymət təsdiq zamanı dəqiqləşdirilə bilər.
      </p>
      <h2>3. Çatdırılma və ödəniş</h2>
      <p>
        Çatdırılma: {s.delivery_area}, {s.delivery_text.toLowerCase()}. İş saatları: hər gün {s.open_from}–{s.open_to}.
        Ödəniş çatdırılma zamanı həyata keçirilir. Tətbiq və sayt ödəniş qəbul etmir.
      </p>
      <h2>4. Məsuliyyətli istehlak</h2>
      <p>Spirtli içkilərin həddindən artıq istifadəsi sağlamlığa zərərdir. Sükan arxasında içməyin.</p>
      <h2>5. Əlaqə</h2>
      <p>
        {s.support_email} · {s.whatsapp_number} · {s.address}
      </p>
    </LegalPage>
  )
}
