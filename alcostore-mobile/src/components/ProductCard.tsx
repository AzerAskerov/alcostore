import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Check, Plus } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { discountPercent, formatPrice, formatVolume, type ProductSummary } from '@alcostore/shared'
import { cart } from '@/lib/stores'
import { colors, font, radii } from '@/theme'
import { ProductImage } from './ProductImage'
import { T } from './ui'

function useAdd(p: ProductSummary) {
  const [done, setDone] = useState(false)
  const v = p.variant
  const add = () => {
    if (!v) return
    cart.add({
      product_id: p.id,
      variant_id: v.id,
      slug: p.slug,
      name: p.name,
      volume_ml: v.volume_ml,
      pack_size: v.pack_size,
      unit_price: v.price,
      image_url: p.image_url,
      category_slug: p.category_slug,
    })
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    setDone(true)
    setTimeout(() => setDone(false), 1100)
  }
  return { add, done, canAdd: Boolean(v && v.stock > 0) }
}

/** Grid kartı (Ana səhifə · Populyar) */
export function ProductCard({ p }: { p: ProductSummary }) {
  const v = p.variant
  const off = v ? discountPercent(v.price, v.old_price) : null
  const { add, done, canAdd } = useAdd(p)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={p.name}
      onPress={() => router.push({ pathname: '/mehsul/[slug]', params: { slug: p.slug } })}
      style={s.card}
    >
      <View style={s.imgWrap}>
        <ProductImage url={p.image_url} category={p.category_slug} style={{ flex: 1 }} />
        {off ? (
          <View style={s.badge}>
            <T style={s.badgeText}>−{off}%</T>
          </View>
        ) : null}
      </View>
      <View style={{ padding: 12, gap: 3 }}>
        <T numberOfLines={2} style={{ fontFamily: font.medium, fontSize: 14, minHeight: 36 }}>{p.name}</T>
        <T variant="mono" style={{ fontSize: 11 }}>{v ? formatVolume(v.volume_ml, v.pack_size) : '—'}</T>
        <View style={s.bottom}>
          <View>
            {off && v?.old_price ? <T style={s.old}>{formatPrice(v.old_price)}</T> : null}
            <T variant="price">{v ? formatPrice(v.price) : '—'}</T>
          </View>
          {canAdd ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`${p.name} səbətə at`} onPress={add} hitSlop={6} style={s.plus}>
              {done ? <Check size={18} color={colors.onRed} /> : <Plus size={18} color={colors.onRed} />}
            </Pressable>
          ) : (
            <T variant="mono" style={{ color: colors.faint, fontSize: 10 }}>yoxdur</T>
          )}
        </View>
      </View>
    </Pressable>
  )
}

/** Siyahı sətri (Kateqoriya ekranı) */
export function ProductRow({ p }: { p: ProductSummary }) {
  const v = p.variant
  const off = v ? discountPercent(v.price, v.old_price) : null
  const { add, done, canAdd } = useAdd(p)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={p.name}
      onPress={() => router.push({ pathname: '/mehsul/[slug]', params: { slug: p.slug } })}
      style={s.row}
    >
      <ProductImage url={p.image_url} category={p.category_slug} style={s.thumb} />
      <View style={{ flex: 1, gap: 3 }}>
        <T numberOfLines={2} style={{ fontFamily: font.medium }}>{p.name}</T>
        <T variant="mono">
          {v ? formatVolume(v.volume_ml, v.pack_size) : '—'}
          {p.country ? ` · ${p.country}` : ''}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <T variant="price">{v ? formatPrice(v.price) : '—'}</T>
          {off && v?.old_price ? <T style={s.old}>{formatPrice(v.old_price)}</T> : null}
        </View>
      </View>
      {canAdd ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`${p.name} səbətə at`} onPress={add} hitSlop={6} style={s.plusOutline}>
          {done ? <Check size={18} color={colors.gold} /> : <Plus size={18} color={colors.gold} />}
        </Pressable>
      ) : (
        <T variant="mono" style={{ color: colors.faint }}>yoxdur</T>
      )}
    </Pressable>
  )
}

const s = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  imgWrap: { aspectRatio: 0.85, backgroundColor: colors.surface2 },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.red, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: colors.onRed, fontFamily: font.bold, fontSize: 11 },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6 },
  old: { color: colors.faint, fontSize: 11, textDecorationLine: 'line-through' },
  plus: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  plusOutline: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.goldBorder, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  thumb: { width: 62, height: 82, borderRadius: 8, backgroundColor: colors.surface2 },
})
