import { Search, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { ProductRow } from '@/components/ProductCard'
import { ErrorState, Loading, Screen, T } from '@/components/ui'
import { api } from '@/lib/api'
import { useQuery } from '@/lib/use-query'
import { colors, font, GUTTER, radii } from '@/theme'

export default function SearchScreen() {
  const [text, setText] = useState('')
  const [q, setQ] = useState('')

  // Yazarkən hər hərfdə sorğu göndərməmək üçün
  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 300)
    return () => clearTimeout(t)
  }, [text])

  const res = useQuery(() => (q.length >= 2 ? api.products({ q, page_size: 50 }) : Promise.resolve(null)), q)

  return (
    <Screen>
      <View style={[s.box, { marginHorizontal: GUTTER }]}>
        <Search size={17} color={colors.muted} />
        <TextInput
          autoFocus
          value={text}
          onChangeText={setText}
          placeholder="Məhsul, brend və ya ölkə…"
          placeholderTextColor={colors.faint}
          returnKeyType="search"
          style={s.input}
        />
        {text ? (
          <Pressable accessibilityLabel="Təmizlə" hitSlop={10} onPress={() => setText('')}>
            <X size={17} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={res.data?.items ?? []}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => <ProductRow p={item} />}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 32 }}
        ListHeaderComponent={res.data ? <T variant="mono" style={{ marginTop: 12 }}>{res.data.total} nəticə</T> : null}
        ListEmptyComponent={
          q.length < 2 ? (
            <T variant="muted" style={{ textAlign: 'center', marginTop: 40 }}>Ən azı 2 hərf yazın</T>
          ) : res.loading ? (
            <Loading />
          ) : res.error ? (
            <ErrorState message={res.error} onRetry={res.refresh} />
          ) : (
            <T variant="muted" style={{ textAlign: 'center', marginTop: 40 }}>«{q}» üzrə heç nə tapılmadı</T>
          )
        }
      />
    </Screen>
  )
}

const s = StyleSheet.create({
  box: { height: 46, borderRadius: radii.input, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginTop: 8 },
  input: { flex: 1, color: colors.text, fontFamily: font.regular, fontSize: 15 },
})
