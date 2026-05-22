import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { ProfileUpdateSchema, getPortfolioData, updateProfile } from '@/lib/portfolio'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const content = await getPortfolioData()
  return NextResponse.json(content)
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = ProfileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  const updated = await updateProfile(parsed.data)

  revalidatePath('/')
  revalidatePath('/about')

  return NextResponse.json({ ok: true, profile: updated.profile })
}

