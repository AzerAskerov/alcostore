import { router } from 'expo-router'
import { ChevronRight, Heart, Search } from 'lucide-react-native'
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ProductImage } from '@/components/ProductImage'
import { ErrorState, Loading, Screen, T } from '@/components/ui'
import { api } from '@/lib/api'
import { favoritesStore } from '@/lib/stores'
import { useQuery } from '@/lib/use-query'
import { colors, font, GUTTER, radii } from '@/theme'

export default function Catalog() {
  const insets = useSafeAreaInsets()
  const { data, error, loading, refreshing, refresh } = useQuery(() => api.categories())
  const favCount = favoritesStore.use().length

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: GUTTER, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} />}
      >
        <T variant="title" style={{ fontSize: 36, marginBottom: 16 }}>Kataloq</T>
        <Pressable accessibilityRole="search" onPress={() => router.push('/axtaris')} style={s.search}>
          <Search size={17} color={colors.muted} />
          <T style={{ color: colors.faint }}>Məhsul, brend və ya ölkə…</T>
        </Pressable>

        <Pressable onPress={() => router.push('/sevimliler')} style={s.fav} accessibilityRole="button">
          <Heart size={18} color={colors.red} />
          <T style={{ flex: 1, fontFamily: font.medium }}>Sevimlilər</T>
          <T variant="mono">{favCount}</T>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>

        {loading ? <Loading /> : null}
        {!loading && !data ? <ErrorState message={error ?? 'Xəta'} onRetry={refresh} /> : null}
        <View style={s.grid}>
          {data?.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={c.name_az}
              onPress={() => router.push({ pathname: '/kateqoriya/[slug]', params: { slug: c.slug } })}
              style={s.cat}
            >
              <ProductImage url={c.image_url} category={c.slug} style={s.catImg} />
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: font.serif, fontSize: 24 }}>{c.name_az}</T>
                <T variant="mono">{c.product_count} məhsul</T>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  )
}

const s = StyleSheet.create({
  search: { height: 44, borderRadius: radii.input, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  fav: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, padding: 14, borderRadius: radii.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  grid: { gap: 10, marginTop: 16 },
  cat: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 10, borderRadius: radii.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  catImg: { width: 72, height: 90, borderRadius: 10, backgroundColor: colors.surface2 },
})
