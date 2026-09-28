/** Mağaza Bakı vaxtı ilə işləyir (UTC+4, yay vaxtı yoxdur). */
const BAKU_OFFSET_MIN = 4 * 60

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function bakuMinutesOfDay(now: Date = new Date()): number {
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes()
  return (utcMin + BAKU_OFFSET_MIN) % (24 * 60)
}

/** Gecə yarısını keçən saatları da dəstəkləyir (məs. 18:00–02:00). */
export function isStoreOpen(openFrom: string, openTo: string, now: Date = new Date()): boolean {
  const cur = bakuMinutesOfDay(now)
  const from = toMinutes(openFrom)
  const to = toMinutes(openTo)
  if (from === to) return true
  return from < to ? cur >= from && cur < to : cur >= from || cur < to
}
