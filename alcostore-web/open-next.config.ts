import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// Səhifələr force-dynamic-dir (datanı API-dən hər sorğuda alır, API öz Cache-Control-u ilə keşlənir),
// ona görə build zamanı prerender olunmuş boş HTML riski yoxdur (TurMat-dakı 2026-08-16 hadisəsi).
export default defineCloudflareConfig({})
