'use client'

import { useState } from 'react'
import type { Banner } from '@alcostore/shared'
import { Btn, Card, ErrorNote, PageTitle } from '@/components/admin/AdminShell'
import { adminApi } from '@/lib/admin-api'
import { useLoad } from '@/lib/use-load'

type Draft = {
  id?: number
  kicker: string
  title: string
  subtitle: string
  link: string
  image_key: string
  image_url?: string | null
  sort: number
  starts_at: string
  ends_at: string
  is_active: boolean
}

const toDraft = (b?: Banner): Draft =>
  b
    ? {
        id: b.id, kicker: b.kicker ?? '', title: b.title, subtitle: b.subtitle ?? '', link: b.link ?? '',
        image_key: '', image_url: b.image_url, sort: b.sort, starts_at: b.starts_at ?? '', ends_at: b.ends_at ?? '', is_active: b.is_active,
      }
    : { kicker: 'KAMPANİYA', title: '', subtitle: '', link: '', image_key: '', sort: 0, starts_at: '', ends_at: '', is_active: true }

export default function BannersPage() {
  const { data, error, reload } = useLoad(() => adminApi.get<Banner[]>('/banners'))
  const [draft, setDraft] = useState<Draft | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const save = async () => {
    if (!draft) return
    setErr(null)
    try {
      // Mövcud şəkli saxlamaq üçün: image_key boşdursa və image_url varsa, URL-in açarını yenidən göndəririk
      const keep = !draft.image_key && draft.image_url ? draft.image_url.split('/media/')[1] ?? draft.image_url : draft.image_key
      const body = { ...draft, image_key: keep || null, starts_at: draft.starts_at || null, ends_at: draft.ends_at || null }
      if (draft.id) await adminApi.put(`/banners/${draft.id}`, body)
      else await adminApi.post('/banners', body)
      setDraft(null)
      reload()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xəta')
    }
  }

  const upload = async (file: File) => {
    try {
      const r = await adminApi.upload<{ key: string; url: string }>('/uploads', file)
      setDraft((d) => (d ? { ...d, image_key: r.key, image_url: r.url } : d))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Yükləmə alınmadı')
    }
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Bannerlər" action={<Btn onClick={() => setDraft(toDraft())}>+ Banner</Btn>} />
      <p className="text-sm text-muted">
        Ana səhifədəki kampaniya blokları. Link nümunələri: <code>/kateqoriya/serab</code>, <code>/mehsul/chivas-regal-12</code>. Mətndə
        həddindən artıq içkini təşviq etməyin — store qaydalarına ziddir.
      </p>
      <ErrorNote error={error || err} />
      {draft ? (
        <Card className="grid gap-3 md:grid-cols-2">
          <div><label>Kiçik başlıq</label><input value={draft.kicker} onChange={(e) => setDraft({ ...draft, kicker: e.target.value })} /></div>
          <div><label>Başlıq *</label><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
          <div><label>Alt mətn</label><input value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} /></div>
          <div><label>Link</label><input value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder="/kateqoriya/serab" /></div>
          <div><label>Başlama (UTC, istəyə görə)</label><input type="datetime-local" value={draft.starts_at.replace(' ', 'T').slice(0, 16)} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value.replace('T', ' ') })} /></div>
          <div><label>Bitmə (UTC, istəyə görə)</label><input type="datetime-local" value={draft.ends_at.replace(' ', 'T').slice(0, 16)} onChange={(e) => setDraft({ ...draft, ends_at: e.target.value.replace('T', ' ') })} /></div>
          <div><label>Sıra</label><input type="number" value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })} /></div>
          <div>
            <label>Şəkil (istəyə görə)</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            {draft.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.image_url} alt="" className="mt-2 h-20 rounded" />
            ) : null}
          </div>
          <label className="flex items-center gap-2 text-sm text-text3"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} /> Aktiv</label>
          <div className="flex gap-2 md:col-span-2">
            <Btn onClick={save} disabled={!draft.title}>Yadda saxla</Btn>
            <Btn variant="ghost" onClick={() => setDraft(null)}>Ləğv</Btn>
          </div>
        </Card>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {data?.map((b) => (
          <div key={b.id} className={`promo rounded-[16px] p-5 ${b.is_active ? '' : 'opacity-50'}`}>
            {b.kicker ? <div className="kicker text-red">{b.kicker}</div> : null}
            <div className="mt-1 font-serif text-2xl">{b.title}</div>
            <div className="text-sm text-text3">{b.subtitle}</div>
            <div className="mt-2 font-mono text-xs text-muted">{b.link}</div>
            <div className="mt-3 flex gap-2">
              <Btn variant="ghost" onClick={() => setDraft(toDraft(b))}>Redaktə</Btn>
              <Btn variant="danger" onClick={async () => { if (confirm('Banner silinsin?')) { await adminApi.del(`/banners/${b.id}`); reload() } }}>Sil</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
