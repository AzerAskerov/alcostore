/** Dizayn sənədindən (AlcoStore_design.html) götürülmüş tokenlər. Yalnız tünd tema. */
export const colors = {
  page: '#050403',
  bg: '#0E0C0B',
  bar: '#100E0D',
  surface: '#171413',
  surface2: '#1F1A18',
  text: '#F2EDE7',
  text2: '#E4DCD4',
  text3: '#C9C0B8',
  muted: '#9B918A',
  faint: '#6E635C',
  red: '#E31E24',
  onRed: '#FFF3F2',
  redDeep1: '#1B0F10',
  redDeep2: '#241315',
  gold: '#D9A441',
  goldHover: '#D8A855',
  green: '#25D366',
  onGreen: '#07320F',
  waBoxBg: '#111B14',
  waBoxText: '#CFE8D6',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  goldBorder: 'rgba(217,164,65,0.45)',
  success: '#4ADE80',
} as const

export const radii = {
  card: 16,
  input: 12,
  button: 14,
  small: 9,
  thumb: 8,
  pill: 999,
} as const

/** Kateqoriya üçün şüşə illüstrasiyası rəngləri (foto olmayanda). */
export const bottlePalette: Record<string, { glass: string; label: string; liquid: string; cap: string }> = {
  serab: { glass: '#2A0E12', label: '#E4DCD4', liquid: '#6B1620', cap: '#5A1018' },
  viski: { glass: '#3A2414', label: '#D9A441', liquid: '#B87424', cap: '#1B120C' },
  konyak: { glass: '#33200F', label: '#D9A441', liquid: '#8E4B1E', cap: '#D9A441' },
  araq: { glass: '#1E252B', label: '#F2EDE7', liquid: '#9FB2C0', cap: '#C9C0B8' },
  pive: { glass: '#243014', label: '#D9A441', liquid: '#C99A2E', cap: '#E31E24' },
  sampan: { glass: '#15211A', label: '#D9A441', liquid: '#E8D9A0', cap: '#D9A441' },
  default: { glass: '#2B211B', label: '#D9A441', liquid: '#513D2E', cap: '#4A392C' },
}

export function paletteFor(categorySlug: string | null | undefined) {
  return bottlePalette[categorySlug ?? ''] ?? bottlePalette.default
}
