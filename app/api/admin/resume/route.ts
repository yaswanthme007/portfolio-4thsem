import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { updateResume } from '@/lib/portfolio'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('resume')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 })
    }

    if (!file.type.includes('pdf')) {
      return NextResponse.json({ error: 'Please upload a PDF resume' }, { status: 400 })
    }

    // 4MB limit for Redis storage
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'Resume file is too large (max 4MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const fileUrl = `data:${file.type};base64,${base64}`

    const resume = await updateResume({
      fileUrl,
      fileName: file.name || 'resume.pdf',
      uploadedAt: new Date().toISOString(),
      mimeType: file.type || 'application/pdf',
    })

    revalidatePath('/')
    revalidatePath('/about')

    return NextResponse.json({ ok: true, resume: resume.resume })
  } catch (err) {
    console.error('[API/Resume] POST error:', err)
    return NextResponse.json({ error: 'Internal server error during resume upload' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updated = await updateResume({ fileUrl: '', fileName: '', uploadedAt: '', mimeType: '' })

    revalidatePath('/')
    revalidatePath('/about')

    return NextResponse.json({ ok: true, resume: updated.resume })
  } catch (err) {
    console.error('[API/Resume] DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error while removing resume' }, { status: 500 })
  }
}
