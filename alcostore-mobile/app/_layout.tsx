import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono'
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans'
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif'
import { useFonts } from 'expo-font'
import { router, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'
import { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { onNotificationLink, syncDevice } from '@/lib/notifications'
import { hydrateAll, prefsStore } from '@/lib/stores'
import { colors, font } from '@/theme'

SplashScreen.preventAutoHideAsync().catch(() => {})
SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {})

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    DMMono_400Regular,
    DMMono_500Medium,
  })
  const [hydrated, setHydrated] = useState(false)
  const prefs = prefsStore.use()

  useEffect(() => {
    hydrateAll().finally(() => setHydrated(true))
  }, [])

  const ready = fontsLoaded && hydrated

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {})
  }, [ready])

  // Cihaz qeydiyyatı (icazə soruşmadan) — yalnız yaş təsdiqindən sonra
  useEffect(() => {
    if (ready && prefs.ageConfirmed) syncDevice()
  }, [ready, prefs.ageConfirmed])

  // Bildirişə toxunanda linki aç (Expo Go-da push yoxdur — funksiya boş qaytarır)
  useEffect(() => {
    if (!ready || !prefs.ageConfirmed) return
    return onNotificationLink((link) => router.push(link as never))
  }, [ready, prefs.ageConfirmed])

  if (!ready) return null

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: font.bold, fontSize: 16 },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Protected guard={prefs.ageConfirmed}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="kateqoriya/[slug]" options={{ title: '' }} />
          <Stack.Screen name="mehsul/[slug]" options={{ title: '', headerTransparent: true }} />
          <Stack.Screen name="axtaris" options={{ title: 'Axtarış' }} />
          <Stack.Screen name="sevimliler" options={{ title: 'Sevimlilər' }} />
        </Stack.Protected>
        <Stack.Protected guard={!prefs.ageConfirmed}>
          <Stack.Screen name="age-gate" options={{ headerShown: false, animation: 'fade' }} />
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  )
}
