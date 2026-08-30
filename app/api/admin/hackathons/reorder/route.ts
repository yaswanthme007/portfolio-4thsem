import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdminRequest } from '@/lib/admin-auth'
import { reorderHackathons } from '@/lib/hackathons'

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const ids: string[] = body?.ids
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 })
  }

  const hackathons = await reorderHackathons(ids)

  revalidatePath('/')
  revalidatePath('/hackathons')
  revalidatePath('/dashboard-yaswanth')

  return NextResponse.json({ ok: true, hackathons })
}
