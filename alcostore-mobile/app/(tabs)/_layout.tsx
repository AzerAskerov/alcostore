import { Tabs } from 'expo-router'
import { Home, LayoutGrid, ShoppingBag, User } from 'lucide-react-native'
import { useCartCount } from '@/lib/stores'
import { colors, font } from '@/theme'

export default function TabsLayout() {
  const count = useCartCount()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bar, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ana', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="kataloq" options={{ title: 'Kataloq', tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} /> }} />
      <Tabs.Screen
        name="sebet"
        options={{
          title: 'Səbət',
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.red, color: colors.onRed, fontFamily: font.bold, fontSize: 10 },
        }}
      />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tabs>
  )
}
