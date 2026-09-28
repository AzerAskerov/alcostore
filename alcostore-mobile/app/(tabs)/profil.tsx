import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import { ChevronRight, Copy, FileText, Camera, Heart, MessageCircle, Phone, Shield, Trash2 } from 'lucide-react-native'
import { useEffect, useState, type ReactNode } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RESPONSIBLE_NOTICE, whatsappUrl } from '@alcostore/shared'
import { Screen, T } from '@/components/ui'
import * as WebBrowser from 'expo-web-browser'
import { api } from '@/lib/api'
import { APP_ENV, APP_VERSION, WEB_URL } from '@/lib/config'
import { getPushPermission, setPushEnabled, type PushPermission } from '@/lib/notifications'
import { prefsStore } from '@/lib/stores'
import { useQuery } from '@/lib/use-query'
import { colors, font, GUTTER, radii } from '@/theme'

/** Hüquqi səhifələr vebdəki ilə eynidir — tətbiqdaxili brauzerdə açılır. */
const openWeb = (path: string) =>
  WebBrowser.openBrowserAsync(`${WEB_URL}${path}`, {
    toolbarColor: colors.bg,
    controlsColor: colors.gold,
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  })

export default function Profile() {
  const insets = useSafeAreaInsets()
  const prefs = prefsStore.use()
  const settings = useQuery(() => api.settings()).data
  const [perm, setPerm] = useState<PushPermission | null>(null)

  useEffect(() => {
    getPushPermission().then(setPerm)
  }, [])

  const pushOn = perm === 'granted' && prefs.pushEnabled

  const togglePush = async (v: boolean) => {
    const p = await setPushEnabled(v)
    setPerm(p)
    if (v && p === 'denied') {
      Alert.alert('Bildirişlər bağlıdır', 'Telefonun ayarlarından Alco Store üçün bildirişlərə icazə verin.', [
        { text: 'Ləğv', style: 'cancel' },
        { text: 'Ayarlar', onPress: () => Linking.openSettings() },
      ])
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: GUTTER, paddingBottom: 40 }}>
        <T variant="title" style={{ fontSize: 36, marginBottom: 16 }}>Profil</T>

        <Section title="Bildirişlər">
          <View style={s.item}>
            <T style={{ flex: 1 }}>Kampaniya və yeniliklər</T>
            <Switch
              value={pushOn}
              onValueChange={togglePush}
              trackColor={{ true: colors.red, false: colors.surface2 }}
              thumbColor={colors.text}
              accessibilityLabel="Bildirişlər"
            />
          </View>
        </Section>

        <Section title="Mənim">
          <Item icon={<Heart size={18} color={colors.red} />} label="Sevimlilər" onPress={() => router.push('/sevimliler')} />
        </Section>

        {settings ? (
          <Section title="Əlaqə">
            <Item icon={<MessageCircle size={18} color={colors.green} />} label={`WhatsApp · ${settings.whatsapp_number}`} onPress={() => Linking.openURL(whatsappUrl(settings.whatsapp_number))} />
            <Item icon={<Phone size={18} color={colors.gold} />} label={`Zəng · ${settings.phone}`} onPress={() => Linking.openURL(`tel:${settings.phone.replace(/\s/g, '')}`)} />
            {settings.instagram ? (
              <Item icon={<Camera size={18} color={colors.text3} />} label="Instagram · @alcostore.baku" onPress={() => Linking.openURL(settings.instagram)} />
            ) : null}
            <View style={s.item}>
              <T variant="small" style={{ flex: 1 }}>
                {settings.delivery_area} · hər gün {settings.open_from}–{settings.open_to}
              </T>
            </View>
          </Section>
        ) : null}

        <Section title="Hüquqi">
          <Item icon={<Shield size={18} color={colors.text3} />} label="Məxfilik siyasəti" onPress={() => openWeb('/privacy')} />
          <Item icon={<FileText size={18} color={colors.text3} />} label="İstifadə şərtləri" onPress={() => openWeb('/terms')} />
          <Item icon={<Trash2 size={18} color={colors.text3} />} label="Məlumatlarımı sil" onPress={() => openWeb('/data-deletion')} />
        </Section>

        <Pressable
          onLongPress={async () => {
            await Clipboard.setStringAsync(prefs.deviceId)
            Alert.alert('Kopyalandı', 'Cihaz ID kopyalandı')
          }}
          style={s.device}
        >
          <Copy size={14} color={colors.faint} />
          <T variant="mono" style={{ fontSize: 10, color: colors.faint, flex: 1 }} numberOfLines={1}>
            Cihaz ID: {prefs.deviceId}
          </T>
        </Pressable>
        <T variant="mono" style={{ textAlign: 'center', color: colors.faint, fontSize: 10, marginTop: 8 }}>
          v{APP_VERSION}{APP_ENV !== 'production' ? ` · ${APP_ENV}` : ''}
        </T>
        <T variant="small" style={{ textAlign: 'center', color: colors.faint, marginTop: 16 }}>{RESPONSIBLE_NOTICE}</T>
      </ScrollView>
    </Screen>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <T variant="kicker" style={{ color: colors.faint, marginBottom: 8 }}>{title}</T>
      <View style={s.section}>{children}</View>
    </View>
  )
}

function Item({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.item, pressed && { backgroundColor: colors.surface2 }]} accessibilityRole="button">
      {icon}
      <T style={{ flex: 1, fontFamily: font.medium }}>{label}</T>
      <ChevronRight size={16} color={colors.muted} />
    </Pressable>
  )
}

const s = StyleSheet.create({
  section: { borderRadius: radii.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  device: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, padding: 10 },
})
