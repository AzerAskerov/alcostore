/**
 * Expo Push API — FCM (Android) və APNs (iOS) üzərindən çatdırır.
 * https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const CHUNK = 100

export interface PushPayload {
  title: string
  body: string
  data?: Record<string, unknown>
  image?: string
}

export interface PushTicket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error?: string }
}

export function isExpoPushToken(token: unknown): token is string {
  return (
    typeof token === 'string' &&
    (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) &&
    token.endsWith(']')
  )
}

export interface PushResult {
  sent: number
  failed: number
  /** DeviceNotRegistered qaytaran tokenlər — bazadan söndürülməlidir */
  deadTokens: string[]
}

export async function sendPush(tokens: string[], payload: PushPayload, accessToken?: string): Promise<PushResult> {
  const valid = tokens.filter(isExpoPushToken)
  const result: PushResult = { sent: 0, failed: tokens.length - valid.length, deadTokens: [] }

  for (let i = 0; i < valid.length; i += CHUNK) {
    const chunk = valid.slice(i, i + CHUNK)
    const messages = chunk.map((to) => ({
      to,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: 'default',
      priority: 'high',
      channelId: 'default',
      ...(payload.image ? { richContent: { image: payload.image } } : {}),
    }))
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(messages),
      })
      if (!res.ok) throw new Error(`Expo push ${res.status}: ${await res.text()}`)
      const json = (await res.json()) as { data: PushTicket[] }
      json.data.forEach((t, idx) => {
        if (t.status === 'ok') result.sent++
        else {
          result.failed++
          if (t.details?.error === 'DeviceNotRegistered') result.deadTokens.push(chunk[idx])
        }
      })
    } catch (e) {
      console.error('[push] chunk failed', e)
      result.failed += chunk.length
    }
  }
  return result
}
