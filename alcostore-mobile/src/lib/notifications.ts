import { isRunningInExpoGo } from 'expo'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { api } from './api'
import { APP_VERSION, EAS_PROJECT_ID } from './config'
import { prefsStore } from './stores'

type NotificationsModule = typeof import('expo-notifications')

/**
 * Expo Go (SDK 53+) Android-də remote push-u dəstəkləmir və `expo-notifications` import olunanda xəta atır.
 * Ona görə modulu yalnız dev/store build-də tənbəl (lazy) yükləyirik; Expo Go-da push sadəcə söndürülür,
 * qalan hər şey işləyir.
 */
export const PUSH_SUPPORTED = !isRunningInExpoGo() && Platform.OS !== 'web'

let mod: NotificationsModule | null | undefined
function N(): NotificationsModule | null {
  if (mod !== undefined) return mod
  if (!PUSH_SUPPORTED) return (mod = null)
  mod = require('expo-notifications') as NotificationsModule
  mod.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
  return mod
}

const platform = Platform.OS === 'ios' ? 'ios' : 'android'

async function ensureAndroidChannel() {
  const n = N()
  if (!n || Platform.OS !== 'android') return
  await n.setNotificationChannelAsync('default', {
    name: 'Kampaniyalar və yeniliklər',
    importance: n.AndroidImportance.HIGH,
    lightColor: '#E31E24',
  })
}

export type PushPermission = 'granted' | 'denied' | 'undetermined' | 'unsupported'

export async function getPushPermission(): Promise<PushPermission> {
  const n = N()
  if (!n) return 'unsupported'
  const { status } = await n.getPermissionsAsync()
  return status as PushPermission
}

async function getToken(): Promise<string | null> {
  const n = N()
  if (!n || !Device.isDevice || !EAS_PROJECT_ID) return null
  try {
    const { data } = await n.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID })
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
  const n = N()
  if (!n) return 'unsupported'
  await ensureAndroidChannel()
  const { status } = await n.requestPermissionsAsync()
  prefsStore.set((p) => ({ ...p, pushPromptDismissed: true, pushEnabled: status === 'granted' }))
  await syncDevice()
  return status as PushPermission
}

export async function setPushEnabled(enabled: boolean): Promise<PushPermission> {
  if (!N()) return 'unsupported'
  if (enabled && (await getPushPermission()) !== 'granted') return requestPushPermission()
  prefsStore.set((p) => ({ ...p, pushEnabled: enabled }))
  await syncDevice()
  return getPushPermission()
}

function linkFrom(data: unknown): string | null {
  const link = (data as { link?: unknown } | undefined)?.link
  return typeof link === 'string' && link.startsWith('/') ? link : null
}

/**
 * Bildirişə toxunanda data.link-i ("/mehsul/...") qaytarır.
 * Soyuq açılış (tətbiq bağlı ikən toxunma) və tətbiq açıq ikən toxunma hər ikisi işləyir.
 */
export function onNotificationLink(cb: (link: string) => void): () => void {
  const n = N()
  if (!n) return () => {}
  const last = n.getLastNotificationResponse()
  const initial = linkFrom(last?.notification.request.content.data)
  if (initial) cb(initial)
  const sub = n.addNotificationResponseReceivedListener((r) => {
    const link = linkFrom(r.notification.request.content.data)
    if (link) cb(link)
  })
  return () => sub.remove()
}
