'use client'

import { useState } from 'react'
import type { AdminStats, NotificationLog } from '@alcostore/shared'
import { Btn, Card, ErrorNote, PageTitle } from '@/components/admin/AdminShell'
import { adminApi } from '@/lib/admin-api'
import { useLoad } from '@/lib/use-load'

export default function NotificationsPage() {
  const logs = useLoad(() => adminApi.get<NotificationLog[]>('/notifications'))
  const stats = useLoad(() => adminApi.get<AdminStats>('/stats'))
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const send = async () => {
    const target = deviceId ? `cihaz ${deviceId}` : `${stats.data?.push_devices ?? '?'} cihaz`
    if (!confirm(`Bildiriş göndərilsin? Hədəf: ${target}`)) return
    setBusy(true)
    setErr(null)
    setOk(null)
    try {
      const r = await adminApi.post<{ sent: number; failed: number; removed: number }>('/notifications', {
        title, body, link: link || undefined, device_id: deviceId || undefined,
      })
      setOk(`Göndərildi: ${r.sent}, alınmadı: ${r.failed}${r.removed ? `, silinmiş token: ${r.removed}` : ''}`)
      setTitle('')
      setBody('')
      logs.reload()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xəta')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Push bildirişlər" />
      <Card className="space-y-3">
        <p className="text-sm text-muted">
          Bildirişə icazə vermiş cihaz sayı: <b className="text-gold">{stats.data?.push_devices ?? '…'}</b>. Əvvəlcə öz cihazınıza
          test edin (cihaz ID tətbiqdə Profil ekranında görünür).
        </p>
        <div><label>Başlıq * (maks. 80)</label><input maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Həftəsonu endirimi" /></div>
        <div><label>Mətn * (maks. 240)</label><textarea maxLength={240} rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Seçilmiş şərablara 15% endirim — bazar gününə qədər." /></div>
        <div className="grid gap-3 md:grid-cols-2">
          <div><label>Link (tətbiqdə açılacaq)</label><input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/mehsul/chivas-regal-12 və ya /kateqoriya/serab" /></div>
          <div><label>Yalnız bu cihaza (test)</label><input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="boş = hamıya" /></div>
        </div>
        <ErrorNote error={err} />
        {ok ? <div className="text-sm text-wa">{ok}</div> : null}
        <Btn onClick={send} disabled={busy || !title || !body}>{busy ? 'Göndərilir…' : deviceId ? 'Test göndər' : 'Hamıya göndər'}</Btn>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">Tarixçə</h2>
        <ErrorNote error={logs.error} />
        <table className="w-full text-sm">
          <tbody className="divide-y divide-line">
            {logs.data?.map((l) => (
              <tr key={l.id}>
                <td className="py-2 pr-3 font-mono text-xs text-muted">{l.created_at}</td>
                <td className="py-2 pr-3"><b>{l.title}</b><div className="text-xs text-muted">{l.body}</div></td>
                <td className="py-2 pr-3 text-xs text-muted">{l.target}</td>
                <td className="py-2 text-right font-mono text-xs">{l.sent_count} ✓ / {l.failed_count} ✗</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.data && !logs.data.length ? <p className="text-sm text-muted">Hələ bildiriş göndərilməyib.</p> : null}
      </Card>
    </div>
  )
}
