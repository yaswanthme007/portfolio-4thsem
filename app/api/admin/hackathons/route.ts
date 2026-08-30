import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdminRequest } from '@/lib/admin-auth'
import {
  getHackathons,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  HackathonInputSchema,
  type HackathonImage,
} from '@/lib/hackathons'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024

async function encodeImages(formData: FormData): Promise<{ images: HackathonImage[]; error?: string }> {
  const files = formData.getAll('images').filter((f): f is File => f instanceof File && f.size > 0)
  const images: HackathonImage[] = []
  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) {
      return { images: [], error: `"${file.name}" is too large (max 4MB per image)` }
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    images.push({ url: `data:${file.type};base64,${buffer.toString('base64')}`, name: file.name })
  }
  return { images }
}

function slugify(title: string) {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const hackathons = await getHackathons()
  return NextResponse.json({ hackathons })
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const { images, error: imageError } = await encodeImages(formData)
  if (imageError) return NextResponse.json({ error: imageError }, { status: 400 })

  const title = String(formData.get('title') ?? '').trim()
  const body = {
    title,
    slug: String(formData.get('slug') ?? '').trim() || slugify(title),
    description: String(formData.get('description') ?? '').trim(),
    year: String(formData.get('year') ?? '').trim(),
    tags: String(formData.get('tags') ?? '').split(',').map(t => t.trim()).filter(Boolean),
    repoUrl: String(formData.get('repoUrl') ?? '').trim() || undefined,
    liveUrl: String(formData.get('liveUrl') ?? '').trim() || undefined,
    images,
  }

  const parsed = HackathonInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const hackathon = await createHackathon(parsed.data)

  revalidatePath('/')
  revalidatePath('/hackathons')
  revalidatePath('/dashboard-yaswanth')

  return NextResponse.json({ ok: true, hackathon })
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const formData = await request.formData()
  const { images: newImages, error: imageError } = await encodeImages(formData)
  if (imageError) return NextResponse.json({ error: imageError }, { status: 400 })

  const existingImagesRaw = formData.get('existingImages')
  let images: HackathonImage[] | undefined
  if (typeof existingImagesRaw === 'string') {
    try {
      images = [...(JSON.parse(existingImagesRaw) as HackathonImage[]), ...newImages]
    } catch {
      return NextResponse.json({ error: 'Invalid existingImages payload' }, { status: 400 })
    }
  }

  const patch: Record<string, unknown> = {}
  for (const key of ['title', 'slug', 'description', 'year', 'repoUrl', 'liveUrl'] as const) {
    const value = formData.get(key)
    if (typeof value === 'string' && value.trim()) patch[key] = value.trim()
  }
  const tagsRaw = formData.get('tags')
  if (typeof tagsRaw === 'string') {
    patch.tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
  }
  if (images) patch.images = images

  const parsed = HackathonInputSchema.partial().safeParse(patch)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const hackathon = await updateHackathon(id, parsed.data)
  if (!hackathon) return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 })

  revalidatePath('/')
  revalidatePath('/hackathons')
  revalidatePath('/dashboard-yaswanth')

  return NextResponse.json({ ok: true, hackathon })
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const ok = await deleteHackathon(id)
  if (!ok) return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 })

  revalidatePath('/')
  revalidatePath('/hackathons')
  revalidatePath('/dashboard-yaswanth')

  return NextResponse.json({ ok: true })
}
