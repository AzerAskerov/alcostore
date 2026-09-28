import { colors, radii } from '@alcostore/shared'

export { colors, radii }

/** useFonts açarları (app/_layout.tsx-də yüklənir) */
export const font = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
} as const

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 32 } as const

/** Dizaynda ekran kənarları 22px-dir */
export const GUTTER = 22
