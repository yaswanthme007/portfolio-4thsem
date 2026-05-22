import { NextRequest, NextResponse } from 'next/server'
import { createAdminSessionToken } from '@/lib/admin-session'

const SESSION_COOKIE = 'yaswanth_admin_session'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const username = String(formData.get('username') ?? '')
  const password = String(formData.get('password') ?? '')
  const expectedUser = process.env.ADMIN_USERNAME || 'admin'
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin'

  if (username !== expectedUser || password !== expectedPassword) {
    return NextResponse.redirect(new URL('/dashboard-yaswanth/login?error=1', request.url), 303)
  }

  const secret = process.env.ADMIN_SESSION_SECRET || 'yaswanth-admin-session-secret'
  const token = await createAdminSessionToken(secret)
  const nextPath = String(request.nextUrl.searchParams.get('next') ?? '/dashboard-yaswanth')
  const safeNext = nextPath.startsWith('/dashboard-yaswanth') ? nextPath : '/dashboard-yaswanth'

  const response = NextResponse.redirect(new URL(safeNext, request.url), 303)
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  return response
}
