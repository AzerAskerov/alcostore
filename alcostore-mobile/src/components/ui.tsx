import * as Haptics from 'expo-haptics'
import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { colors, font, GUTTER, radii } from '@/theme'

export function T({
  children,
  style,
  variant = 'body',
  numberOfLines,
}: {
  children: ReactNode
  style?: StyleProp<TextStyle>
  variant?: 'body' | 'title' | 'display' | 'kicker' | 'mono' | 'muted' | 'price' | 'small'
  numberOfLines?: number
}) {
  return (
    <Text numberOfLines={numberOfLines} style={[s.base, s[variant], style]} maxFontSizeMultiplier={1.4}>
      {children}
    </Text>
  )
}

type BtnVariant = 'primary' | 'outline' | 'whatsapp' | 'ghost'

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
  accessibilityLabel,
}: {
  title: string
  onPress: () => void
  variant?: BtnVariant
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}) {
  const v = btn[variant]
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled || loading}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {})
        onPress()
      }}
      style={({ pressed }) => [s.btn, v.box, (disabled || loading) && { opacity: 0.5 }, pressed && { opacity: 0.85 }, style]}
    >
      {loading ? <ActivityIndicator color={v.text.color} /> : icon}
      <Text style={[s.btnText, v.text]}>{title}</Text>
    </Pressable>
  )
}

export function Chip({ label, active, onPress, disabled }: { label: string; active?: boolean; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[s.chip, active ? s.chipActive : s.chipIdle, disabled && s.chipDisabled]}
    >
      <Text style={[s.chipText, { color: active ? colors.onRed : disabled ? colors.faint : colors.text3 }]}>{label}</Text>
    </Pressable>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>
}

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>{children}</View>
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <ActivityIndicator color={colors.gold} />
    </View>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={{ alignItems: 'center', padding: 40, gap: 16 }}>
      <T variant="muted" style={{ textAlign: 'center' }}>{message}</T>
      {onRetry ? <Button title="Yenidən cəhd et" variant="outline" onPress={onRetry} /> : null}
    </View>
  )
}

export function IconButton({ children, onPress, label, style }: { children: ReactNode; onPress: () => void; label: string } & Pick<PressableProps, 'style'>) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={8} onPress={onPress} style={style}>
      {children}
    </Pressable>
  )
}

const s = StyleSheet.create({
  base: { color: colors.text, fontFamily: font.regular, fontSize: 15 },
  body: {},
  small: { fontSize: 13, color: colors.text3 },
  title: { fontFamily: font.serif, fontSize: 30, lineHeight: 34 },
  display: { fontFamily: font.serif, fontSize: 38, lineHeight: 40 },
  kicker: { fontFamily: font.mono, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.red },
  mono: { fontFamily: font.mono, fontSize: 12, color: colors.muted },
  muted: { color: colors.muted, fontSize: 14 },
  price: { fontFamily: font.bold, color: colors.gold, fontSize: 17 },
  btn: { height: 54, borderRadius: radii.button, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  btnText: { fontFamily: font.bold, fontSize: 15 },
  chip: { paddingHorizontal: 14, height: 34, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  chipIdle: { borderWidth: 1, borderColor: colors.borderStrong },
  chipActive: { backgroundColor: colors.red },
  chipDisabled: { borderColor: colors.border },
  chipText: { fontFamily: font.mono, fontSize: 12 },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: 16 },
})

const btn: Record<BtnVariant, { box: ViewStyle; text: TextStyle }> = {
  primary: { box: { backgroundColor: colors.red }, text: { color: colors.onRed } },
  outline: { box: { borderWidth: 1, borderColor: colors.goldBorder }, text: { color: colors.gold } },
  whatsapp: { box: { backgroundColor: colors.green }, text: { color: colors.onGreen } },
  ghost: { box: { borderWidth: 1, borderColor: colors.border }, text: { color: colors.text3 } },
}

export const layout = StyleSheet.create({
  gutter: { paddingHorizontal: GUTTER },
  row: { flexDirection: 'row', alignItems: 'center' },
})
