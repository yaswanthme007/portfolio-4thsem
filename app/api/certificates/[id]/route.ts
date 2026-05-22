import { NextRequest, NextResponse } from 'next/server'
import { getPortfolioData } from '@/lib/portfolio'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { certificates } = await getPortfolioData()
    const cert = certificates.find(c => c.id === id)

    if (!cert || !cert.fileUrl) {
      return new NextResponse('Certificate not found', { status: 404 })
    }

    if (cert.fileUrl.startsWith('data:')) {
      const [header, base64Data] = cert.fileUrl.split(',')
      const mimeType = header.split(':')[1].split(';')[0]
      const buffer = Buffer.from(base64Data, 'base64')

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${cert.fileName || 'certificate'}"`,
        },
      })
    }

    // Fallback if it's still a legacy filesystem URL
    return NextResponse.redirect(new URL(cert.fileUrl, request.url))
  } catch (err) {
    console.error('[API/Certificates/Proxy] Error serving certificate:', err)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
