import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Bell, Search, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isStoreOpen } from '@alcostore/shared'
import { ProductCard } from '@/components/ProductCard'
import { Button, Chip, ErrorState, Loading, Screen, T } from '@/components/ui'
import { api } from '@/lib/api'
import { getPushPermission, requestPushPermission } from '@/lib/notifications'
import { prefsStore } from '@/lib/stores'
import { useQuery } from '@/lib/use-query'
import { colors, font, GUTTER, radii } from '@/theme'

export default function Home() {
  const insets = useSafeAreaInsets()
  const { data, error, loading, refreshing, refresh } = useQuery(() => api.home())
  const prefs = prefsStore.use()
  const [perm, setPerm] = useState<string | null>(null)

  useEffect(() => {
    getPushPermission().then(setPerm)
  }, [])

  if (loading) return <Loading />
  if (!data) return <ErrorState message={error ?? 'Xəta'} onRetry={refresh} />

  const { settings, categories, banners, popular } = data
  const open = isStoreOpen(settings.open_from, settings.open_to)
  const showPushCard = perm === 'undetermined' && !prefs.pushPromptDismissed

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} />}
      >
        {/* Header */}
        <View style={[s.header, s.gutter]}>
          <Image source={require('../../assets/icon.png')} style={s.logo} />
          <View style={{ flex: 1 }}>
            <T style={s.store}>{settings.store_name.toUpperCase()}</T>
            <T variant="kicker" style={{ fontSize: 9 }}>Şərab evi · Bakı</T>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <T variant="kicker" style={{ color: open ? colors.red : colors.faint }}>{open ? 'Açıq' : 'Bağlı'}</T>
            <T variant="mono" style={{ fontSize: 11 }}>{settings.open_from}–{settings.open_to}</T>
          </View>
        </View>

        {/* Search */}
        <Pressable accessibilityRole="search" onPress={() => router.push('/axtaris')} style={[s.search, { marginHorizontal: GUTTER }]}>
          <Search size={17} color={colors.muted} />
          <T style={{ color: colors.faint }}>Məhsul axtar…</T>
        </Pressable>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.gutter, { gap: 8, paddingVertical: 16 }]}>
          {categories.map((c) => (
            <Chip key={c.id} label={c.name_az} onPress={() => router.push({ pathname: '/kateqoriya/[slug]', params: { slug: c.slug } })} />
          ))}
        </ScrollView>

        {/* Banners */}
        {banners.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => b.link && router.push(b.link as never)}
            style={[s.promo, { marginHorizontal: GUTTER }]}
            accessibilityRole="button"
          >
            {b.image_url ? <Image source={{ uri: b.image_url }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
            <View style={s.promoShade}>
              {b.kicker ? <T variant="kicker">{b.kicker}</T> : null}
              <T style={s.promoTitle}>{b.title}</T>
              {b.subtitle ? <T variant="small">{b.subtitle}</T> : null}
            </View>
          </Pressable>
        ))}

        {/* Push pre-prompt */}
        {showPushCard ? (
          <View style={[s.pushCard, { marginHorizontal: GUTTER }]}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <Bell size={20} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: font.bold }}>Kampaniyalardan xəbərdar olun</T>
                <T variant="small" style={{ marginTop: 2 }}>Endirimlər və yeni məhsullar haqqında bildiriş alın. İstənilən vaxt söndürə bilərsiniz.</T>
              </View>
              <Pressable accessibilityLabel="Bağla" hitSlop={10} onPress={() => prefsStore.set((p) => ({ ...p, pushPromptDismissed: true }))}>
                <X size={18} color={colors.muted} />
              </Pressable>
            </View>
            <Button
              title="Bildirişlərə icazə ver"
              variant="outline"
              style={{ height: 44, marginTop: 12 }}
              onPress={async () => setPerm(await requestPushPermission())}
            />
          </View>
        ) : null}

        {/* Popular */}
        <View style={[s.gutter, s.sectionHead]}>
          <T style={s.section}>Populyar</T>
          <Pressable onPress={() => router.push('/kataloq')} hitSlop={8}>
            <T style={{ color: colors.gold, fontSize: 13 }}>Hamısı</T>
          </Pressable>
        </View>
        <View style={[s.gutter, s.grid]}>
          {popular.map((p) => (
            <View key={p.id} style={s.cell}>
              <ProductCard p={p} />
            </View>
          ))}
        </View>

        <T variant="small" style={[s.gutter, { color: colors.faint, textAlign: 'center', marginTop: 24 }]}>
          Spirtli içkilərin 18 yaşdan kiçiklərə satışı qadağandır.
        </T>
      </ScrollView>
    </Screen>
  )
}

const s = StyleSheet.create({
  gutter: { paddingHorizontal: GUTTER },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  logo: { width: 42, height: 42, borderRadius: 21 },
  store: { fontFamily: font.bold, fontSize: 17, letterSpacing: 0.5 },
  search: { height: 44, borderRadius: radii.input, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  promo: { borderRadius: radii.card, borderWidth: 1, borderColor: 'rgba(227,30,36,0.45)', backgroundColor: colors.redDeep2, minHeight: 150, overflow: 'hidden', justifyContent: 'flex-end', marginBottom: 12 },
  promoShade: { padding: 18, paddingTop: 36, gap: 4, backgroundColor: 'rgba(0,0,0,0.55)' },
  promoTitle: { fontFamily: font.serif, fontSize: 24, lineHeight: 28 },
  pushCard: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.goldBorder, backgroundColor: colors.surface, padding: 16, marginBottom: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 12, marginBottom: 12 },
  section: { fontFamily: font.serif, fontSize: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  cell: { width: '48.3%' },
})
