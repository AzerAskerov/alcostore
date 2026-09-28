import { Image } from 'expo-image'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LEGAL_NOTICE, MIN_AGE, RESPONSIBLE_NOTICE } from '@alcostore/shared'
import { Button, Screen, T } from '@/components/ui'
import { prefsStore } from '@/lib/stores'
import { colors, GUTTER } from '@/theme'

/** Tətbiqin ilk ekranı: 18+ təsdiqi. "Xeyr" seçildikdə tətbiqə giriş bağlanır. */
export default function AgeGate() {
  const insets = useSafeAreaInsets()
  const [denied, setDenied] = useState(false)

  return (
    <Screen style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24, paddingHorizontal: GUTTER }}>
      <View style={s.center}>
        <Image source={require('../assets/icon.png')} style={s.logo} />
        {!denied ? (
          <>
            <T variant="kicker" style={{ marginTop: 28 }}>{MIN_AGE}+</T>
            <T variant="display" style={s.title}>{MIN_AGE} yaşınız tamam olub?</T>
            <T variant="muted" style={s.text}>
              {LEGAL_NOTICE} Tətbiqdən istifadə etmək üçün yaşınızı təsdiqləyin.
            </T>
          </>
        ) : (
          <>
            <T variant="display" style={[s.title, { marginTop: 28 }]}>Təəssüf ki, daxil ola bilməzsiniz</T>
            <T variant="muted" style={s.text}>Bu tətbiq yalnız {MIN_AGE} yaşdan yuxarı şəxslər üçündür.</T>
          </>
        )}
      </View>
      {!denied ? (
        <View style={{ gap: 12 }}>
          <Button title={`Bəli, ${MIN_AGE} yaşım var`} onPress={() => prefsStore.set((p) => ({ ...p, ageConfirmed: true }))} />
          <Button title="Xeyr" variant="ghost" onPress={() => setDenied(true)} />
          <T variant="small" style={{ textAlign: 'center', color: colors.faint, marginTop: 8 }}>{RESPONSIBLE_NOTICE}</T>
        </View>
      ) : (
        <Button title="Geri" variant="ghost" onPress={() => setDenied(false)} />
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 132, height: 132, borderRadius: 66 },
  title: { textAlign: 'center', marginTop: 10 },
  text: { textAlign: 'center', marginTop: 14, lineHeight: 21 },
})
