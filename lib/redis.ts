import { createClient } from 'redis'

type RedisClient = ReturnType<typeof createClient>

let redisClientPromise: Promise<RedisClient | null> | null = null
let redisUnavailable = false
let redisWarningShown = false

function normalizeRedisUrl(raw?: string) {
  const value = raw?.trim()
  if (!value) return null

  const trimmed = value.replace(/^redis-cli\s+-u\s+/i, '')
  if (!/^rediss?:\/\//i.test(trimmed)) return null

  try {
    const url = new URL(trimmed)
    return url.protocol === 'redis:' || url.protocol === 'rediss:' ? trimmed : null
  } catch {
    return null
  }
}

export function getRedisUrl() {
  return normalizeRedisUrl(process.env.REDIS_URL)
}

export function hasRedisUrl() {
  return Boolean(getRedisUrl())
}

function warnRedisUnavailable(err: unknown) {
  if (redisWarningShown) return
  redisWarningShown = true

  const message = err instanceof Error ? err.message : String(err)
  console.warn(`Redis unavailable; using local/static fallback data. ${message}`)
}

export async function getRedisClient(): Promise<RedisClient | null> {
  const url = getRedisUrl()
  if (!url || redisUnavailable) return null

  if (!redisClientPromise) {
    const client = createClient({
      url,
      socket: {
        connectTimeout: 1500,
        reconnectStrategy: false,
      },
    })

    client.on('error', () => {
      // connect() handles/reporting the first failure; avoid noisy reconnect logs.
    })

    redisClientPromise = client.connect().then(() => client).catch(err => {
      redisClientPromise = null
      redisUnavailable = true
      warnRedisUnavailable(err)
      return null
    })
  }

  return redisClientPromise
}
