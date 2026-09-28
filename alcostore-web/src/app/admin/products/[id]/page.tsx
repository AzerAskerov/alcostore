'use client'

import { useParams, useRouter } from 'next/navigation'
import { Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { slugify, type Category, type Product, type ProductVariant } from '@alcostore/shared'
import { Btn, Card, ErrorNote, PageTitle } from '@/components/admin/AdminShell'
import { adminApi } from '@/lib/admin-api'
import { useLoad } from '@/lib/use-load'

type Form = {
  name: string
  slug: string
  category_id: string
  brand: string
  country: string
  abv: string
  description_az: string
  description_ru: string
  has_gift_box: boolean
  is_featured: boolean
  is_active: boolean
  sort: string
}

const EMPTY: Form = {
  name: '', slug: '', category_id: '', brand: '', country: '', abv: '', description_az: '', description_ru: '',
  has_gift_box: false, is_featured: false, is_active: true, sort: '0',
}

type VariantDraft = Omit<ProductVariant, 'id' | 'product_id'> & { id?: number }
const NEW_VARIANT: VariantDraft = { volume_ml: 700, pack_size: 1, price: 0, old_price: null, stock: 0, sku: null, is_active: true }

function toForm(p: Product | null): Form {
  if (!p) return EMPTY
  return {
    name: p.name, slug: p.slug, category_id: String(p.category_id), brand: p.brand ?? '', country: p.country ?? '',
    abv: p.abv === null ? '' : String(p.abv), description_az: p.description_az ?? '', description_ru: p.description_ru ?? '',
    has_gift_box: p.has_gift_box, is_featured: p.is_featured, is_active: p.is_active, sort: String(p.sort),
  }
}

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const cats = useLoad(() => adminApi.get<Category[]>('/categories'))
  const product = useLoad(() => (isNew ? Promise.resolve(null) : adminApi.get<Product>(`/products/${id}`)), id)
  const [msg, setMsg] = useState<string | null>(null)

  if (product.error) return <ErrorNote error={product.error} />
  if (!isNew && !product.data) return <PageTitle title="Məhsul" />
  return (
    <ProductEditor
      // Yeni data gələndə formu təmiz vəziyyətdən başladırıq
      key={product.data?.updated_at ?? 'new'}
      id={id}
      isNew={isNew}
      initial={product.data}
      categories={cats.data ?? []}
      reload={product.reload}
      msg={msg}
      setMsg={setMsg}
    />
  )
}

function ProductEditor({
  id,
  isNew,
  initial,
  categories,
  reload,
  msg,
  setMsg,
}: {
  id: string
  isNew: boolean
  initial: Product | null
  categories: Category[]
  reload: () => void
  msg: string | null
  setMsg: (m: string | null) => void
}) {
  const router = useRouter()
  const [form, setForm] = useState<Form>(() => toForm(initial))
  const [variants, setVariants] = useState<VariantDraft[]>(() => (initial?.variants.length ? initial.variants : [{ ...NEW_VARIANT }]))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const product = { data: initial, reload }
  const cats = { data: categories }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))
  const payload = () => ({
    ...form,
    slug: form.slug || slugify(form.name),
    category_id: Number(form.category_id),
    abv: form.abv === '' ? null : Number(form.abv),
    sort: Number(form.sort) || 0,
  })

  const save = async () => {
    setSaving(true)
    setError(null)
    setMsg(null)
    try {
      if (isNew) {
        const r = await adminApi.post<{ id: number }>('/products', { ...payload(), variants })
        router.replace(`/admin/products/${r.id}`)
        return
      }
      await adminApi.put(`/products/${id}`, payload())
      for (const v of variants) {
        if (v.id) await adminApi.put(`/variants/${v.id}`, v)
        else await adminApi.post(`/products/${id}/variants`, v)
      }
      setMsg('Yadda saxlanıldı')
      product.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xəta')
    } finally {
      setSaving(false)
    }
  }

  const removeVariant = async (idx: number) => {
    const v = variants[idx]
    if (v.id) {
      if (!confirm('Variantı silmək?')) return
      await adminApi.del(`/variants/${v.id}`)
    }
    setVariants((vs) => vs.filter((_, i) => i !== idx))
  }

  const upload = async (file: File) => {
    setError(null)
    try {
      await adminApi.upload(`/products/${id}/images`, file)
      product.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yükləmə alınmadı')
    }
  }

  const del = async () => {
    if (!confirm('Məhsulu tamamilə silmək? Bunu geri qaytarmaq olmur. Müvəqqəti gizlətmək üçün “Aktiv” işarəsini götürün.')) return
    await adminApi.del(`/products/${id}`)
    router.replace('/admin/products')
  }

  const updVar = (i: number, patch: Partial<VariantDraft>) => setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)))

  return (
    <div className="space-y-5">
      <PageTitle
        title={isNew ? 'Yeni məhsul' : form.name || 'Məhsul'}
        action={
          <div className="flex gap-2">
            {!isNew ? <Btn variant="danger" onClick={del}>Sil</Btn> : null}
            <Btn onClick={save} disabled={saving || !form.name || !form.category_id}>{saving ? 'Saxlanılır…' : 'Yadda saxla'}</Btn>
          </div>
        }
      />
      <ErrorNote error={error} />
      {msg ? <div className="text-sm text-wa">{msg}</div> : null}

      <Card className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label>Ad *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label>Kateqoriya *</label>
          <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
            <option value="">Seçin</option>
            {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name_az}</option>)}
          </select>
        </div>
        <div>
          <label>Slug (URL)</label>
          <input value={form.slug} placeholder={slugify(form.name)} onChange={(e) => set('slug', e.target.value)} />
        </div>
        <div>
          <label>Brend</label>
          <input value={form.brand} onChange={(e) => set('brand', e.target.value)} />
        </div>
        <div>
          <label>Ölkə</label>
          <input value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="Şotlandiya" />
        </div>
        <div>
          <label>Spirt %</label>
          <input type="number" step="0.1" value={form.abv} onChange={(e) => set('abv', e.target.value)} />
        </div>
        <div>
          <label>Sıra</label>
          <input type="number" value={form.sort} onChange={(e) => set('sort', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label>Təsvir (AZ)</label>
          <textarea rows={3} value={form.description_az} onChange={(e) => set('description_az', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label>Təsvir (RU, istəyə görə)</label>
          <textarea rows={2} value={form.description_ru} onChange={(e) => set('description_ru', e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-6 md:col-span-2">
          {(
            [
              ['is_active', 'Aktiv (saytda görünür)'],
              ['is_featured', 'Populyar (ana səhifədə)'],
              ['has_gift_box', 'Hədiyyə qutusu'],
            ] as const
          ).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-sm text-text3">
              <input type="checkbox" checked={form[k]} onChange={(e) => set(k, e.target.checked)} /> {l}
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Variantlar (həcm, qiymət, stok)</h2>
          <Btn variant="ghost" onClick={() => setVariants((v) => [...v, { ...NEW_VARIANT }])}>+ Variant</Btn>
        </div>
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={v.id ?? `n${i}`} className="grid grid-cols-2 items-end gap-2 rounded-[10px] border border-line p-3 md:grid-cols-[repeat(7,1fr)_auto]">
              <div><label>Həcm (ml)</label><input type="number" value={v.volume_ml} onChange={(e) => updVar(i, { volume_ml: Number(e.target.value) })} /></div>
              <div><label>Paket (əd.)</label><input type="number" value={v.pack_size} onChange={(e) => updVar(i, { pack_size: Number(e.target.value) || 1 })} /></div>
              <div><label>Qiymət ₼</label><input type="number" step="0.01" value={v.price} onChange={(e) => updVar(i, { price: Number(e.target.value) })} /></div>
              <div><label>Köhnə qiymət</label><input type="number" step="0.01" value={v.old_price ?? ''} onChange={(e) => updVar(i, { old_price: e.target.value === '' ? null : Number(e.target.value) })} /></div>
              <div><label>Stok</label><input type="number" value={v.stock} onChange={(e) => updVar(i, { stock: Number(e.target.value) })} /></div>
              <div><label>SKU</label><input value={v.sku ?? ''} onChange={(e) => updVar(i, { sku: e.target.value || null })} /></div>
              <label className="flex items-center gap-2 pb-2 text-sm text-text3"><input type="checkbox" checked={v.is_active} onChange={(e) => updVar(i, { is_active: e.target.checked })} /> Aktiv</label>
              <button aria-label="Variantı sil" onClick={() => removeVariant(i)} className="pb-2 text-faint hover:text-red"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </Card>

      {!isNew ? (
        <Card>
          <h2 className="mb-3 font-semibold">Şəkillər</h2>
          <p className="mb-3 text-xs text-muted">JPG / PNG / WEBP, maks. 5 MB. Şəffaf və ya tünd fonlu, şaquli (3:4) şəkil ən yaxşı görünür. Birinci şəkil əsasdır.</p>
          <div className="flex flex-wrap gap-3">
            {product.data?.images.map((img, i) => (
              <div key={img.id} className="relative h-40 w-30 overflow-hidden rounded-[10px] border border-line bg-surface2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-contain" />
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 p-1">
                  <button title="Əsas et" disabled={i === 0} onClick={async () => { await adminApi.post(`/images/${img.id}/primary`); product.reload() }} className={i === 0 ? 'text-gold' : 'text-text3'}>
                    <Star size={14} />
                  </button>
                  <button title="Sil" onClick={async () => { if (confirm('Şəkli silmək?')) { await adminApi.del(`/images/${img.id}`); product.reload() } }} className="text-text3 hover:text-red">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <label className="flex h-40 w-30 cursor-pointer items-center justify-center rounded-[10px] border border-dashed border-line-strong text-sm text-muted hover:border-gold">
              + Şəkil
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
          </div>
        </Card>
      ) : (
        <p className="text-sm text-muted">Şəkilləri məhsulu yadda saxladıqdan sonra əlavə edə bilərsiniz.</p>
      )}
    </div>
  )
}
