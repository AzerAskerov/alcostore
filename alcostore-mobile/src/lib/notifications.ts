import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { api } from './api'
import { APP_VERSION, EAS_PROJECT_ID } from './config'
import { prefsStore } from './stores'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const platform = Platform.OS === 'ios' ? 'ios' : 'android'

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Kampaniyalar və yeniliklər',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#E31E24',
  })
}

export type PushPermission = 'granted' | 'denied' | 'undetermined'

export async function getPushPermission(): Promise<PushPermission> {
  const { status } = await Notifications.getPermissionsAsync()
  return status as PushPermission
}

async function getToken(): Promise<string | null> {
  if (!Device.isDevice || !EAS_PROJECT_ID || EAS_PROJECT_ID.startsWith('REPLACE')) return null
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID })
    return data
  } catch (e) {
    console.warn('[push] token alınmadı', e)
    return null
  }
}

/** Cihazı API-də qeyd edir. İcazə artıq varsa tokeni də göndərir (icazə soruşmur). */
export async function syncDevice(): Promise<void> {
  const { deviceId, pushEnabled } = prefsStore.get()
  if (!deviceId) return
  await ensureAndroidChannel()
  const granted = (await getPushPermission()) === 'granted'
  const token = granted && pushEnabled ? await getToken() : null
  await api
    .registerDevice({
      device_id: deviceId,
      platform,
      push_token: token,
      locale: 'az',
      app_version: APP_VERSION,
      push_enabled: pushEnabled && granted,
    })
    .catch(() => {})
}

/** İstifadəçi "İcazə ver" basanda sistem pəncərəsini açır. */
export async function requestPushPermission(): Promise<PushPermission> {
  await ensureAndroidChannel()
  const { status } = await Notifications.requestPermissionsAsync()
  prefsStore.set((p) => ({ ...p, pushPromptDismissed: true, pushEnabled: status === 'granted' }))
  await syncDevice()
  return status as PushPermission
}

export async function setPushEnabled(enabled: boolean): Promise<PushPermission> {
  if (enabled && (await getPushPermission()) !== 'granted') return requestPushPermission()
  prefsStore.set((p) => ({ ...p, pushEnabled: enabled }))
  await syncDevice()
  return getPushPermission()
}

/** Bildirişin data.link-i ("/mehsul/..."), tətbiq daxilində açmaq üçün. */
export function linkFromNotification(n: Notifications.Notification | null | undefined): string | null {
  const link = n?.request.content.data?.link
  return typeof link === 'string' && link.startsWith('/') ? link : null
}
