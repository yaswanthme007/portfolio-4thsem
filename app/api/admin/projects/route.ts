import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdminRequest } from '@/lib/admin-auth'
import { z } from 'zod'
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  ProjectInputSchema,
} from '@/lib/projects'

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const projects = await getProjects()
  return NextResponse.json({ projects })
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = ProjectInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const project = await createProject(parsed.data)

  revalidatePath('/')
  revalidatePath('/work')
  revalidatePath('/projects')

  return NextResponse.json({ ok: true, project })
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await request.json()
  const parsed = ProjectInputSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const project = await updateProject(id, parsed.data)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  revalidatePath('/')
  revalidatePath('/work')
  revalidatePath('/projects')
  revalidatePath(`/work/${project.slug}`)

  return NextResponse.json({ ok: true, project })
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const ok = await deleteProject(id)
  if (!ok) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  revalidatePath('/')
  revalidatePath('/work')
  revalidatePath('/projects')

  return NextResponse.json({ ok: true })
}
