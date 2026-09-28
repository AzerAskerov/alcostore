'use client'

import { useState } from 'react'
import { slugify, type Category } from '@alcostore/shared'
import { Btn, Card, ErrorNote, PageTitle } from '@/components/admin/AdminShell'
import { adminApi } from '@/lib/admin-api'
import { useLoad } from '@/lib/use-load'

type Draft = { id?: number; name_az: string; name_ru: string; slug: string; sort: number; is_active: boolean }

export default function CategoriesPage() {
  const { data, error, reload } = useLoad(() => adminApi.get<Category[]>('/categories'))
  const [draft, setDraft] = useState<Draft | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const save = async () => {
    if (!draft) return
    setErr(null)
    try {
      const body = { ...draft, slug: draft.slug || slugify(draft.name_az) }
      if (draft.id) await adminApi.put(`/categories/${draft.id}`, body)
      else await adminApi.post('/categories', body)
      setDraft(null)
      reload()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xəta')
    }
  }

  const remove = async (c: Category) => {
    if (!confirm(`"${c.name_az}" silinsin?`)) return
    setErr(null)
    try {
      await adminApi.del(`/categories/${c.id}`)
      reload()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xəta')
    }
  }

  return (
    <div className="space-y-4">
      <PageTitle
        title="Kateqoriyalar"
        action={<Btn onClick={() => setDraft({ name_az: '', name_ru: '', slug: '', sort: (data?.length ?? 0) + 1, is_active: true })}>+ Kateqoriya</Btn>}
      />
      <ErrorNote error={error || err} />
      {draft ? (
        <Card className="grid gap-3 md:grid-cols-5">
          <div><label>Ad (AZ)</label><input value={draft.name_az} onChange={(e) => setDraft({ ...draft, name_az: e.target.value })} /></div>
          <div><label>Ad (RU)</label><input value={draft.name_ru} onChange={(e) => setDraft({ ...draft, name_ru: e.target.value })} /></div>
          <div><label>Slug</label><input value={draft.slug} placeholder={slugify(draft.name_az)} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></div>
          <div><label>Sıra</label><input type="number" value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })} /></div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-text3"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} /> Aktiv</label>
          <div className="flex gap-2 md:col-span-5">
            <Btn onClick={save} disabled={!draft.name_az}>Yadda saxla</Btn>
            <Btn variant="ghost" onClick={() => setDraft(null)}>Ləğv</Btn>
          </div>
        </Card>
      ) : null}
      <div className="divide-y divide-line rounded-[14px] border border-line">
        {data?.map((c) => (
          <div key={c.id} className="flex items-center gap-4 p-3">
            <span className="w-6 font-mono text-xs text-muted">{c.sort}</span>
            <div className="flex-1">
              <div className={c.is_active ? '' : 'text-faint line-through'}>{c.name_az}</div>
              <div className="font-mono text-xs text-muted">/{c.slug} · {c.product_count} məhsul</div>
            </div>
            <Btn variant="ghost" onClick={() => setDraft({ id: c.id, name_az: c.name_az, name_ru: c.name_ru ?? '', slug: c.slug, sort: c.sort, is_active: c.is_active })}>Redaktə</Btn>
            <Btn variant="danger" onClick={() => remove(c)}>Sil</Btn>
          </div>
        ))}
      </div>
    </div>
  )
}
