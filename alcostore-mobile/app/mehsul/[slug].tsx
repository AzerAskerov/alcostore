import * as Haptics from 'expo-haptics'
import { Stack, useLocalSearchParams } from 'expo-router'
import { Heart, Minus, Plus, Share2 } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Linking, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  buildProductQuestion,
  discountPercent,
  formatPrice,
  formatVolume,
  whatsappUrl,
  type Product,
  type ProductSummary,
} from '@alcostore/shared'
import { ProductImage } from '@/components/ProductImage'
import { Button, ErrorState, IconButton, Loading, Screen, T } from '@/components/ui'
import { api } from '@/lib/api'
import { WEB_URL } from '@/lib/config'
import { cart, favorites, useIsFavorite } from '@/lib/stores'
import { useQuery } from '@/lib/use-query'
import { colors, font, GUTTER, radii } from '@/theme'

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const q = useQuery(() => api.product(slug), slug)
  const settings = useQuery(() => api.settings()).data

  if (q.loading) return <Loading />
  if (!q.data) return <ErrorState message={q.error ?? 'Məhsul tapılmadı'} onRetry={q.refresh} />
  return <ProductView key={q.data.id} product={q.data} whatsapp={settings?.whatsapp_number} storeName={settings?.store_name ?? 'Alco Store'} />
}

function toSummary(p: Product, variantId: number): ProductSummary {
  const variant = p.variants.find((v) => v.id === variantId) ?? p.variants[0] ?? null
  return {
    id: p.id, slug: p.slug, name: p.name, brand: p.brand, country: p.country, category_slug: p.category_slug,
    category_name: p.category_name, image_url: p.images[0]?.url ?? null, variant, variant_count: p.variants.length, is_featured: p.is_featured,
  }
}

function ProductView({ product, whatsapp, storeName }: { product: Product; whatsapp?: string; storeName: string }) {
  const insets = useSafeAreaInsets()
  const initial = useMemo(() => {
    const inStock = product.variants.filter((v) => v.stock > 0)
    return [...(inStock.length ? inStock : product.variants)].sort((a, b) => a.price - b.price)[0]
  }, [product.variants])
  const [variantId, setVariantId] = useState(initial?.id)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const isFav = useIsFavorite(product.id)
  const v = product.variants.find((x) => x.id === variantId) ?? initial
  const off = v ? discountPercent(v.price, v.old_price) : null
  const soldOut = !v || v.stock <= 0

  const specs = [
    product.abv !== null ? ['Spirt', `${product.abv}%`] : null,
    product.country ? ['Ölkə', product.country] : null,
    product.brand ? ['Brend', product.brand] : null,
    ['Qutu', product.has_gift_box ? 'Var' : 'Yoxdur'],
    v ? ['Stok', v.stock > 0 ? `${v.stock} ədəd` : 'yoxdur'] : null,
  ].filter(Boolean) as [string, string][]

  const add = () => {
    if (!v) return
    cart.add(
      {
        product_id: product.id, variant_id: v.id, slug: product.slug, name: product.name, volume_ml: v.volume_ml,
        pack_size: v.pack_size, unit_price: v.price, image_url: product.images[0]?.url ?? null, category_slug: product.category_slug,
      },
      qty,
    )
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 18 }}>
              <IconButton label="Paylaş" onPress={() => Share.share({ message: `${product.name} — ${WEB_URL}/mehsul/${product.slug}` })}>
                <Share2 size={20} color={colors.text} />
              </IconButton>
              <IconButton label={isFav ? 'Sevimlilərdən çıxar' : 'Sevimlilərə əlavə et'} onPress={() => v && favorites.toggle(toSummary(product, v.id))}>
                <Heart size={20} color={isFav ? colors.red : colors.text} fill={isFav ? colors.red : 'transparent'} />
              </IconButton>
            </View>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[s.hero, { paddingTop: insets.top + 44 }]}>
          <ProductImage url={product.images[0]?.url} category={product.category_slug} style={{ flex: 1, width: '100%' }} fit="contain" />
          <View style={s.age}>
            <T variant="mono" style={{ fontSize: 10, color: colors.text3 }}>18+</T>
          </View>
        </View>

        <View style={{ paddingHorizontal: GUTTER, paddingTop: 18 }}>
          <T variant="kicker">
            {product.category_name}
            {product.country ? ` · ${product.country}` : ''}
          </T>
          <T variant="title" style={{ marginTop: 6 }}>{product.name}</T>

          {product.variants.length > 1 ? (
            <View style={s.variants}>
              {product.variants.map((x) => {
                const out = x.stock <= 0
                const active = x.id === v?.id
                return (
                  <Pressable
                    key={x.id}
                    disabled={out}
                    onPress={() => {
                      setVariantId(x.id)
                      setQty(1)
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled: out }}
                    style={[s.variant, active ? { backgroundColor: colors.red, borderColor: colors.red } : null, out && { opacity: 0.5 }]}
                  >
                    <T style={{ fontFamily: font.mono, fontSize: 13, color: active ? colors.onRed : out ? colors.faint : colors.text3 }}>
                      {formatVolume(x.volume_ml, x.pack_size)}
                      {out ? ' · yoxdur' : ''}
                    </T>
                  </Pressable>
                )
              })}
            </View>
          ) : v ? (
            <T variant="mono" style={{ marginTop: 10 }}>{formatVolume(v.volume_ml, v.pack_size)}</T>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 14 }}>
            <T style={{ fontFamily: font.bold, fontSize: 30, color: colors.gold }}>{v ? formatPrice(v.price) : '—'}</T>
            {off && v?.old_price ? <T style={{ color: colors.faint, textDecorationLine: 'line-through', fontSize: 16 }}>{formatPrice(v.old_price)}</T> : null}
            {off ? (
              <View style={s.offBadge}>
                <T style={{ color: colors.onRed, fontFamily: font.bold, fontSize: 11 }}>−{off}%</T>
              </View>
            ) : null}
          </View>

          {product.description_az ? <T style={{ color: colors.text3, lineHeight: 22, marginTop: 16 }}>{product.description_az}</T> : null}

          <View style={s.specs}>
            {specs.map(([k, val], i) => (
              <View key={k} style={[s.spec, i === specs.length - 1 && { borderBottomWidth: 0 }]}>
                <T variant="muted">{k}</T>
                <T>{val}</T>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[s.bar, { paddingBottom: insets.bottom + 10 }]}>
        {!soldOut ? (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View style={s.stepper}>
              <Pressable accessibilityLabel="Azalt" hitSlop={6} onPress={() => setQty((n) => Math.max(1, n - 1))} style={s.stepBtn}>
                <Minus size={16} color={colors.text3} />
              </Pressable>
              <T style={{ fontFamily: font.mono, minWidth: 20, textAlign: 'center' }}>{qty}</T>
              <Pressable accessibilityLabel="Artır" hitSlop={6} onPress={() => setQty((n) => Math.min(Math.min(50, v!.stock), n + 1))} style={s.stepBtn}>
                <Plus size={16} color={colors.text3} />
              </Pressable>
            </View>
            <Button title={added ? 'Əlavə olundu ✓' : 'Səbətə at'} variant="outline" onPress={add} style={{ flex: 1 }} />
          </View>
        ) : (
          <T style={{ color: colors.red, textAlign: 'center', marginBottom: 4 }}>Bu həcm hazırda stokda yoxdur</T>
        )}
        {whatsapp ? (
          <Button
            title="WhatsApp-da soruş"
            variant="whatsapp"
            style={{ marginTop: 10 }}
            onPress={() => v && Linking.openURL(whatsappUrl(whatsapp, buildProductQuestion(storeName, product.name, v.volume_ml, v.pack_size)))}
          />
        ) : null}
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  hero: { height: 380, backgroundColor: '#1E1713', alignItems: 'center', justifyContent: 'center', paddingBottom: 12 },
  age: { position: 'absolute', right: GUTTER, bottom: 14, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  variants: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  variant: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  offBadge: { backgroundColor: colors.red, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  specs: { marginTop: 18, borderRadius: radii.input, borderWidth: 1, borderColor: colors.border },
  spec: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  bar: { paddingHorizontal: GUTTER, paddingTop: 12, backgroundColor: colors.bar, borderTopWidth: 1, borderTopColor: colors.border },
  stepper: { flexDirection: 'row', alignItems: 'center', height: 54, borderWidth: 1, borderColor: colors.border, borderRadius: radii.button },
  stepBtn: { width: 40, height: 54, alignItems: 'center', justifyContent: 'center' },
})
