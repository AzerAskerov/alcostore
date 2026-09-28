import { Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { FlatList, RefreshControl, ScrollView, View } from 'react-native'
import { formatVolume, type ProductSort } from '@alcostore/shared'
import { ProductRow } from '@/components/ProductCard'
import { Chip, ErrorState, Loading, Screen, T } from '@/components/ui'
import { api } from '@/lib/api'
import { useQuery } from '@/lib/use-query'
import { colors, GUTTER } from '@/theme'

const SORTS: { key: ProductSort; label: string }[] = [
  { key: 'popular', label: 'Populyar' },
  { key: 'price_asc', label: 'Qiymət ↑' },
  { key: 'price_desc', label: 'Qiymət ↓' },
  { key: 'name', label: 'Ad' },
]

type Panel = null | 'country' | 'volume'

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const [sort, setSort] = useState<ProductSort>('price_asc')
  const [country, setCountry] = useState<string | undefined>()
  const [volume, setVolume] = useState<number | undefined>()
  const [panel, setPanel] = useState<Panel>(null)

  const cats = useQuery(() => api.categories())
  const facets = useQuery(() => api.facets(slug), slug)
  const list = useQuery(
    () => api.products({ category: slug, sort, country, volume_ml: volume, page_size: 100 }),
    `${slug}|${sort}|${country}|${volume}`,
  )
  const cat = cats.data?.find((c) => c.slug === slug)

  return (
    <Screen>
      <Stack.Screen options={{ title: cat?.name_az ?? '' }} />
      <FlatList
        data={list.data?.items ?? []}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => <ProductRow p={item} />}
        contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={colors.gold} />}
        ListHeaderComponent={
          <View style={{ paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
              <T variant="title" style={{ fontSize: 36 }}>{cat?.name_az ?? ''}</T>
              <T variant="mono">{list.data?.total ?? ''} məhsul</T>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
              {SORTS.map((s) => (
                <Chip key={s.key} label={s.label} active={sort === s.key} onPress={() => setSort(s.key)} />
              ))}
              <Chip label={country ?? 'Ölkə'} active={Boolean(country) || panel === 'country'} onPress={() => setPanel(panel === 'country' ? null : 'country')} />
              <Chip label={volume ? formatVolume(volume) : 'Həcm'} active={Boolean(volume) || panel === 'volume'} onPress={() => setPanel(panel === 'volume' ? null : 'volume')} />
            </ScrollView>
            {panel === 'country' && facets.data ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 }}>
                <Chip label="Hamısı" active={!country} onPress={() => { setCountry(undefined); setPanel(null) }} />
                {facets.data.countries.map((c) => (
                  <Chip key={c} label={c} active={country === c} onPress={() => { setCountry(c); setPanel(null) }} />
                ))}
              </View>
            ) : null}
            {panel === 'volume' && facets.data ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 }}>
                <Chip label="Hamısı" active={!volume} onPress={() => { setVolume(undefined); setPanel(null) }} />
                {facets.data.volumes.map((v) => (
                  <Chip key={v} label={formatVolume(v)} active={volume === v} onPress={() => { setVolume(v); setPanel(null) }} />
                ))}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          list.loading ? <Loading /> : list.error ? <ErrorState message={list.error} onRetry={list.refresh} /> : <ErrorState message="Bu filtrlərə uyğun məhsul yoxdur." />
        }
      />
    </Screen>
  )
}
