import { router } from 'expo-router'
import { FlatList, View } from 'react-native'
import { ProductRow } from '@/components/ProductCard'
import { Button, Screen, T } from '@/components/ui'
import { favoritesStore } from '@/lib/stores'
import { GUTTER } from '@/theme'

export default function Favorites() {
  const items = favoritesStore.use()
  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => <ProductRow p={item} />}
        contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 32, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <T variant="muted" style={{ textAlign: 'center' }}>Hələ sevimli məhsul yoxdur. Məhsul səhifəsində ♡ işarəsinə toxunun.</T>
            <Button title="Kataloqa keç" variant="outline" onPress={() => router.push('/kataloq')} />
          </View>
        }
      />
    </Screen>
  )
}
