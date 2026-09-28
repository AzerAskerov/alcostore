import { formatPrice, formatVolume } from './format'

export interface WhatsAppLine {
  name: string
  volume_ml: number
  pack_size: number
  qty: number
  unit_price: number
}

export interface WhatsAppMessageInput {
  storeName: string
  lines: WhatsAppLine[]
  subtotal: number
  deliveryFee: number
  total: number
  orderCode?: string
  note?: string
}

/**
 * Dizayndakı şablon:
 *   Salam, Alco Store sifarişi:
 *   • Chivas Regal 12 0.7 L × 1 — 89,00 ₼
 *   Cəmi: 147,00 ₼
 *   Ünvan: ____
 */
export function buildOrderMessage(input: WhatsAppMessageInput): string {
  const header = input.orderCode
    ? `Salam, ${input.storeName} sifarişi (${input.orderCode}):`
    : `Salam, ${input.storeName} sifarişi:`
  const rows = input.lines.map((l) => {
    const vol = l.pack_size > 1 ? `(${formatVolume(l.volume_ml, l.pack_size)})` : formatVolume(l.volume_ml)
    return `• ${l.name} ${vol} × ${l.qty} — ${formatPrice(l.unit_price * l.qty)}`
  })
  const out = [header, '', ...rows, '']
  if (input.deliveryFee > 0) {
    out.push(`Məhsullar: ${formatPrice(input.subtotal)}`)
    out.push(`Çatdırılma: ${formatPrice(input.deliveryFee)}`)
  }
  out.push(`Cəmi: ${formatPrice(input.total)}`)
  if (input.note?.trim()) out.push(`Qeyd: ${input.note.trim()}`)
  out.push('Ünvan: ____')
  return out.join('\n')
}

/** "+994 50 000 00 00" → "994500000000" */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function whatsappUrl(phone: string, text?: string): string {
  const base = `https://wa.me/${normalizePhone(phone)}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

/** Tək məhsul haqqında sual üçün mətn (məhsul kartındakı "WhatsApp" düyməsi). */
export function buildProductQuestion(storeName: string, productName: string, volumeMl: number, packSize = 1): string {
  return `Salam, ${storeName}! ${productName} ${formatVolume(volumeMl, packSize)} haqqında soruşmaq istəyirəm.`
}
