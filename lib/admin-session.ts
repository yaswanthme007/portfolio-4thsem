const encoder = new TextEncoder()

function toBase64Url(bytes: Uint8Array) {
  if (typeof btoa === 'function') {
    let binary = ''
    bytes.forEach(byte => {
      binary += String.fromCharCode(byte)
    })
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }

  return Buffer.from(bytes).toString('base64url')
}

async function hmac(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return toBase64Url(new Uint8Array(signature))
}

export async function createAdminSessionToken(secret: string, ttlSeconds = 60 * 60 * 24) {
  const expiresAt = Date.now() + ttlSeconds * 1000
  const signature = await hmac(secret, String(expiresAt))
  return `${expiresAt}.${signature}`
}

export async function verifyAdminSessionToken(token: string, secret: string) {
  const [expiresAt, signature] = token.split('.')
  if (!expiresAt || !signature) return false
  if (Number(expiresAt) < Date.now()) return false

  const expected = await hmac(secret, expiresAt)
  return expected === signature
}

