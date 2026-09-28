import { router, Stack } from 'expo-router'
import { View } from 'react-native'
import { Button, Screen, T } from '@/components/ui'

export default function NotFound() {
  return (
    <Screen>
      <Stack.Screen options={{ title: '' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <T variant="title">Səhifə tapılmadı</T>
        <Button title="Ana səhifə" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  )
}
