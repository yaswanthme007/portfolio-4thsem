import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { addCertificate, getPortfolioData, removeCertificate } from '@/lib/portfolio'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const content = await getPortfolioData()
    return NextResponse.json({ certificates: content.certificates || [] })
  } catch (err) {
    console.error('[API/Certificates] GET error:', err)
    return NextResponse.json({ error: 'Internal server error while fetching certificates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const title = String(formData.get('title') ?? '').trim()
    const issuer = String(formData.get('issuer') ?? '').trim()
    const year = String(formData.get('year') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const file = formData.get('file')

    if (!title || !issuer || !year) {
      return NextResponse.json({ error: 'Title, issuer, and year are required' }, { status: 400 })
    }

    let fileUrl: string | undefined
    let fileName: string | undefined

    if (file instanceof File && file.size > 0) {
      // 4MB limit for Redis storage chunks is reasonable for certificates
      if (file.size > 4 * 1024 * 1024) {
        return NextResponse.json({ error: 'Certificate file is too large (max 4MB)' }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = buffer.toString('base64')
      fileUrl = `data:${file.type};base64,${base64}`
      fileName = file.name
    }

    const certificate = await addCertificate({
      id: randomUUID(),
      title,
      issuer,
      year,
      description: description || undefined,
      fileUrl,
      fileName,
      uploadedAt: new Date().toISOString(),
    })

    revalidatePath('/')
    revalidatePath('/certificates')

    return NextResponse.json({ ok: true, certificate: certificate.certificates[0] })
  } catch (err) {
    console.error('[API/Certificates] POST error:', err)
    return NextResponse.json({ error: 'Internal server error during certificate upload' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Certificate id is required' }, { status: 400 })
    }

    // No longer need to delete from filesystem as it's stored in Redis
    await removeCertificate(id)

    revalidatePath('/')
    revalidatePath('/certificates')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API/Certificates] DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error while deleting certificate' }, { status: 500 })
  }
}

