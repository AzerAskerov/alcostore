/** "89,00 ₼" — dizayndakı format (vergül, iki onluq, ₼ sonda). */
export function formatPrice(amount: number): string {
  const fixed = (Math.round(amount * 100) / 100).toFixed(2)
  const [int, dec] = fixed.split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${grouped},${dec} ₼`
}

/** 700 → "0.7 L", 330 + pack 6 → "6 × 0.33 L", 50 → "50 ml" */
export function formatVolume(volumeMl: number, packSize = 1): string {
  const base = volumeMl < 100 ? `${volumeMl} ml` : `${Number((volumeMl / 1000).toFixed(3))} L`
  return packSize > 1 ? `${packSize} × ${base}` : base
}

/** Endirim faizi: 104 → 89 = 14 */
export function discountPercent(price: number, oldPrice: number | null | undefined): number | null {
  if (!oldPrice || oldPrice <= price) return null
  return Math.round(((oldPrice - price) / oldPrice) * 100)
}

const AZ_MAP: Record<string, string> = {
  ə: 'e', Ə: 'e', ş: 's', Ş: 's', ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g',
  ı: 'i', I: 'i', İ: 'i', ö: 'o', Ö: 'o', ü: 'u', Ü: 'u',
}

/** Azərbaycan dilində slug: "Şərab Evi" → "serab-evi" */
export function slugify(input: string): string {
  return Array.from(input)
    .map((ch) => AZ_MAP[ch] ?? ch)
    .join('')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
