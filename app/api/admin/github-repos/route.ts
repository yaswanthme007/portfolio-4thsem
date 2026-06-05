import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'

export interface GitHubRepo {
  name: string
  fullName: string
  description: string | null
  htmlUrl: string
  language: string | null
  stars: number
  pushedAt: string | null
  topics: string[]
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const username = process.env.GITHUB_USERNAME || 'yaswanthme007'
  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Thamo-Portfolio',
  }
  if (token && !token.includes('replace_with')) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const res = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=30&type=public`,
      { headers, cache: 'no-store' }
    )
    if (!res.ok) {
      return NextResponse.json({ repos: [], error: 'GitHub API error' })
    }
    const data = await res.json() as any[]
    const repos: GitHubRepo[] = data.map(r => ({
      name: r.name,
      fullName: r.full_name,
      description: r.description ?? null,
      htmlUrl: r.html_url,
      language: r.language ?? null,
      stars: r.stargazers_count ?? 0,
      pushedAt: r.pushed_at ?? null,
      topics: Array.isArray(r.topics) ? r.topics : [],
    }))
    return NextResponse.json({ repos })
  } catch {
    return NextResponse.json({ repos: [], error: 'Failed to fetch repos' })
  }
}
