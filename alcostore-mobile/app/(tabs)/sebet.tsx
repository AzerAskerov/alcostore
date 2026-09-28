import { router } from 'expo-router'
import { Minus, Plus, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { buildOrderMessage, cartTotals, formatPrice, formatVolume } from '@alcostore/shared'
import { ProductImage } from '@/components/ProductImage'
import { Button, ErrorState, Loading, Screen, T } from '@/components/ui'
import { api } from '@/lib/api'
import { cart, cartStore, prefsStore } from '@/lib/stores'
import { useQuery } from '@/lib/use-query'
import { colors, font, GUTTER, radii } from '@/theme'

export default function Cart() {
  const insets = useSafeAreaInsets()
  const lines = cartStore.use()
  const settingsQ = useQuery(() => api.settings())
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)

  if (settingsQ.loading) return <Loading />
  const settings = settingsQ.data
  if (!settings) return <ErrorState message={settingsQ.error ?? 'Xəta'} onRetry={settingsQ.refresh} />

  const totals = cartTotals(lines, settings)

  if (!lines.length) {
    return (
      <Screen style={{ paddingTop: insets.top + 16, paddingHorizontal: GUTTER }}>
        <T variant="title" style={{ fontSize: 36 }}>Səbət</T>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <T variant="muted">Səbətiniz boşdur.</T>
          <Button title="Kataloqa keç" onPress={() => router.push('/kataloq')} style={{ paddingHorizontal: 28 }} />
        </View>
      </Screen>
    )
  }

  const preview = buildOrderMessage({
    storeName: settings.store_name,
    lines,
    subtotal: totals.subtotal,
    deliveryFee: totals.delivery_fee,
    total: totals.total,
    note,
  })

  const send = async () => {
    setSending(true)
    try {
      const res = await api.createOrder({
        source: Platform.OS === 'ios' ? 'ios' : 'android',
        device_id: prefsStore.get().deviceId,
        note: note.trim() || undefined,
        items: lines.map((l) => ({ variant_id: l.variant_id, qty: l.qty })),
      })
      await Linking.openURL(res.whatsapp_url)
      cart.clear()
      setNote('')
    } catch (e) {
      Alert.alert('Sifariş göndərilmədi', e instanceof Error ? e.message : 'Yenidən cəhd edin')
    } finally {
      setSending(false)
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: GUTTER, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <T variant="title" style={{ fontSize: 36, marginBottom: 12 }}>Səbət</T>

        {lines.map((l) => (
          <View key={l.variant_id} style={s.line}>
            <Pressable onPress={() => router.push({ pathname: '/mehsul/[slug]', params: { slug: l.slug } })}>
              <ProductImage url={l.image_url} category={l.category_slug} style={s.thumb} />
            </Pressable>
            <View style={{ flex: 1, gap: 4 }}>
              <T numberOfLines={2} style={{ fontFamily: font.medium }}>{l.name}</T>
              <T variant="mono">{formatVolume(l.volume_ml, l.pack_size)}</T>
              <View style={s.stepper}>
                <Pressable accessibilityLabel="Azalt" hitSlop={8} onPress={() => cart.setQty(l.variant_id, l.qty - 1)} style={s.stepBtn}>
                  {l.qty === 1 ? <Trash2 size={15} color={colors.muted} /> : <Minus size={15} color={colors.text3} />}
                </Pressable>
                <T style={{ fontFamily: font.mono, minWidth: 22, textAlign: 'center' }}>{l.qty}</T>
                <Pressable accessibilityLabel="Artır" hitSlop={8} onPress={() => cart.setQty(l.variant_id, l.qty + 1)} style={s.stepBtn}>
                  <Plus size={15} color={colors.text3} />
                </Pressable>
              </View>
            </View>
            <T variant="price">{formatPrice(l.unit_price * l.qty)}</T>
          </View>
        ))}

        <View style={s.summary}>
          <Row k="Məhsullar" v={formatPrice(totals.subtotal)} />
          <Row k={`Çatdırılma · ${settings.delivery_area}`} v={totals.delivery_fee ? formatPrice(totals.delivery_fee) : 'pulsuz'} vColor={totals.delivery_fee ? undefined : colors.green} />
          {totals.delivery_fee > 0 && settings.free_delivery_min > 0 ? (
            <T variant="small" style={{ color: colors.faint }}>
              {formatPrice(settings.free_delivery_min - totals.subtotal)} də əlavə edin — çatdırılma pulsuz olsun
            </T>
          ) : null}
          <View style={s.totalRow}>
            <T style={{ fontSize: 16 }}>Cəmi</T>
            <T variant="price" style={{ fontSize: 22 }}>{formatPrice(totals.total)}</T>
          </View>
        </View>

        <TextInput
          value={note}
          onChangeText={(t) => setNote(t.slice(0, 500))}
          placeholder="Qeyd (istəyə görə): çatdırılma vaxtı və s."
          placeholderTextColor={colors.faint}
          multiline
          style={s.note}
        />

        <View style={s.waBox}>
          <T variant="kicker" style={{ color: colors.green, marginBottom: 8 }}>WhatsApp-a gedən mətn</T>
          <T style={{ fontFamily: font.mono, fontSize: 12, lineHeight: 18, color: colors.waBoxText }}>{preview}</T>
        </View>

        {totals.below_min_by > 0 ? (
          <T style={{ color: colors.red, marginTop: 12 }}>
            Minimum sifariş {formatPrice(settings.min_order)}. Daha {formatPrice(totals.below_min_by)} əlavə edin.
          </T>
        ) : null}
      </ScrollView>

      <View style={[s.bar, { paddingBottom: 12 }]}>
        <Button title="Sifarişi WhatsApp-a göndər" variant="whatsapp" onPress={send} loading={sending} disabled={totals.below_min_by > 0} style={{ height: 56 }} />
        <T variant="small" style={{ textAlign: 'center', color: colors.faint, marginTop: 8, fontSize: 11 }}>
          Ödəniş və vaxt WhatsApp-da təsdiqlənir · 18 yaşdan yuxarı
        </T>
      </View>
    </Screen>
  )
}

function Row({ k, v, vColor }: { k: string; v: string; vColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <T variant="muted">{k}</T>
      <T style={{ color: vColor ?? colors.text }}>{v}</T>
    </View>
  )
}

const s = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  thumb: { width: 56, height: 74, borderRadius: 8, backgroundColor: colors.surface2 },
  stepper: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border, borderRadius: 10, marginTop: 4 },
  stepBtn: { width: 34, height: 32, alignItems: 'center', justifyContent: 'center' },
  summary: { gap: 8, marginTop: 16, padding: 16, borderRadius: radii.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 },
  note: { marginTop: 12, minHeight: 48, borderRadius: radii.input, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, padding: 12, fontFamily: font.regular },
  waBox: { marginTop: 12, padding: 14, borderRadius: radii.card, backgroundColor: colors.waBoxBg },
  bar: { paddingHorizontal: GUTTER, paddingTop: 12, backgroundColor: colors.bar, borderTopWidth: 1, borderTopColor: colors.border },
})
