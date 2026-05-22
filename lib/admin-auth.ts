import { NextRequest } from 'next/server'
import { verifyAdminSessionToken } from './admin-session'

const SESSION_COOKIE = 'yaswanth_admin_session'

export async function isAdminRequest(request: NextRequest) {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET || 'yaswanth-admin-session-secret'
    const token = request.cookies.get(SESSION_COOKIE)?.value
    if (!token) return false
    return await verifyAdminSessionToken(token, secret)
  } catch (err) {
    console.error('[Auth] isAdminRequest error:', err)
    return false
  }
}

