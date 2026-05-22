import { NextRequest, NextResponse } from 'next/server'
import { getRepoStats } from '@/lib/github'

/* GET /api/github/repo?url=<github-repo-url>
   Returns the public stats for the repo. Cached server-side for 1 hour by
   Next's fetch layer; we also add a Cache-Control header so any CDN in
   front of the app can hold the same response. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing ?url= parameter' }, { status: 400 })
  }

  const stats = await getRepoStats(url)
  if (!stats) {
    return NextResponse.json({ error: 'Repo not found or rate-limited' }, { status: 404 })
  }

  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
