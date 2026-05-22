import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { isAdminRequest } from '@/lib/admin-auth'
import { getPortfolioData, updateEducation } from '@/lib/portfolio'
import { z } from 'zod'

const InputSchema = z.object({
  year: z.string().min(1),
  title: z.string().min(1),
  org: z.string().min(1),
  desc: z.string().optional(),
})

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { education } = await getPortfolioData()
  return NextResponse.json({ education })
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const parsed = InputSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  const { education } = await getPortfolioData()
  const item = { ...parsed.data, id: randomUUID() }
  const updated = await updateEducation([item, ...education])

  revalidatePath('/')
  revalidatePath('/about')

  return NextResponse.json({ ok: true, education: updated.education })
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const body = await request.json()
  const parsed = InputSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  const { education } = await getPortfolioData()
  const updated = await updateEducation(education.map(e => e.id === id ? { ...e, ...parsed.data } : e))

  revalidatePath('/')
  revalidatePath('/about')

  return NextResponse.json({ ok: true, education: updated.education })
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { education } = await getPortfolioData()
  const updated = await updateEducation(education.filter(e => e.id !== id))

  revalidatePath('/')
  revalidatePath('/about')

  return NextResponse.json({ ok: true, education: updated.education })
}
