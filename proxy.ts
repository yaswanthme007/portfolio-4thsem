import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSessionToken } from '@/lib/admin-session'

const SESSION_COOKIE  = 'yaswanth_admin_session'
const ADMIN_ROUTE     = '/dashboard-yaswanth'
const LOGIN_PATH      = '/dashboard-yaswanth/login'
const LOGIN_API_PATH  = '/api/admin/login'
const LOGOUT_API_PATH = '/api/admin/logout'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const secret = process.env.ADMIN_SESSION_SECRET || 'yaswanth-admin-session-secret'

  const token    = request.cookies.get(SESSION_COOKIE)?.value
  const isAuthed = token ? await verifyAdminSessionToken(token, secret) : false

  // Allow the login page through (redirect away if already authed)
  if (pathname === LOGIN_PATH) {
    if (isAuthed) {
      const nextPath = request.nextUrl.searchParams.get('next') || ADMIN_ROUTE
      const safeNext = nextPath.startsWith(ADMIN_ROUTE) && nextPath !== LOGIN_PATH
        ? nextPath
        : ADMIN_ROUTE
      return NextResponse.redirect(new URL(safeNext, request.url))
    }
    return NextResponse.next()
  }

  // Allow login/logout API calls through
  if (pathname === LOGIN_API_PATH || pathname === LOGOUT_API_PATH) {
    return NextResponse.next()
  }

  // Authenticated — all good
  if (isAuthed) return NextResponse.next()

  // Unauthenticated API call
  if (pathname.startsWith('/api/admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Unauthenticated page — redirect to login
  const loginUrl = new URL(LOGIN_PATH, request.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/dashboard-yaswanth/:path*', '/api/admin/:path*'],
}
