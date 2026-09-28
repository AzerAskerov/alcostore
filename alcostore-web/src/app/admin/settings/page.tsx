'use client'

import { useState } from 'react'
import type { StoreSettings } from '@alcostore/shared'
import { Btn, Card, ErrorNote, PageTitle } from '@/components/admin/AdminShell'
import { adminApi } from '@/lib/admin-api'
import { useLoad } from '@/lib/use-load'

const FIELDS: { key: keyof StoreSettings; label: string; type?: string; hint?: string }[] = [
  { key: 'store_name', label: 'Mağaza adı' },
  { key: 'tagline', label: 'Qısa şüar' },
  { key: 'whatsapp_number', label: 'WhatsApp nömrəsi', hint: 'Sifarişlər bu nömrəyə gedir. Store review üçün real və cavab verən olmalıdır.' },
  { key: 'phone', label: 'Telefon' },
  { key: 'open_from', label: 'Açılış (HH:MM)', type: 'time' },
  { key: 'open_to', label: 'Bağlanış (HH:MM)', type: 'time' },
  { key: 'delivery_area', label: 'Çatdırılma zonası' },
  { key: 'delivery_text', label: 'Çatdırılma mətni' },
  { key: 'free_delivery_min', label: 'Pulsuz çatdırılma həddi ₼ (0 = həmişə pulsuz)', type: 'number' },
  { key: 'delivery_fee', label: 'Çatdırılma haqqı ₼', type: 'number' },
  { key: 'min_order', label: 'Minimum sifariş ₼', type: 'number' },
  { key: 'support_email', label: 'Dəstək e-poçtu' },
  { key: 'address', label: 'Ünvan' },
  { key: 'instagram', label: 'Instagram linki' },
]

export default function SettingsPage() {
  const { data, error } = useLoad(() => adminApi.get<StoreSettings>('/settings'))
  if (error) return <ErrorNote error={error} />
  if (!data) return <PageTitle title="Ayarlar" />
  return <SettingsForm initial={data} />
}

function SettingsForm({ initial }: { initial: StoreSettings }) {
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, String(v)])),
  )
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const save = async () => {
    setMsg(null)
    setErr(null)
    try {
      await adminApi.put('/settings', form)
      setMsg('Yadda saxlanıldı')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xəta')
    }
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Ayarlar" action={<Btn onClick={save}>Yadda saxla</Btn>} />
      <ErrorNote error={err} />
      {msg ? <div className="text-sm text-wa">{msg}</div> : null}
      <Card className="grid gap-4 md:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label>{f.label}</label>
            <input type={f.type ?? 'text'} value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            {f.hint ? <p className="mt-1 text-xs text-faint">{f.hint}</p> : null}
          </div>
        ))}
      </Card>
    </div>
  )
}
