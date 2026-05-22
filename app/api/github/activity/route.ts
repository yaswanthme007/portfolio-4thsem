import { NextResponse } from 'next/server'
import { getRecentActivity } from '@/lib/github'

/* GET /api/github/activity
   Returns up to 12 recent public events from the configured GitHub user.
   Cached 5 minutes server-side; surfaced with stale-while-revalidate so the
   feed feels live without hammering GitHub. */
export async function GET() {
  const events = await getRecentActivity(4)
  return NextResponse.json({ events }, {
    headers: {
      'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
