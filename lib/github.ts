export interface GitHubStats {
  currentStreak: number
  longestStreak: number
  totalContributions: number
  lastContributionDate: string | null
}

export interface CalendarDay {
  date: string
  contributionCount: number
}

export interface CalendarWeek {
  contributionDays: CalendarDay[]
}

export interface GitHubCalendar {
  weeks: CalendarWeek[]
  totalContributions: number
}

function countStreak(days: CalendarDay[]) {
  const byDate = new Map(days.map(day => [day.date, day.contributionCount]))
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  let currentStreak = 0
  let cursor = new Date(today)

  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    const count = byDate.get(key) ?? 0
    if (count <= 0) break
    currentStreak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  let longestStreak = 0
  let run = 0
  for (const day of days) {
    if (day.contributionCount > 0) {
      run += 1
      longestStreak = Math.max(longestStreak, run)
    } else {
      run = 0
    }
  }

  const totalContributions = days.reduce((sum, day) => sum + day.contributionCount, 0)
  const lastContributionDate = [...days].reverse().find(day => day.contributionCount > 0)?.date ?? null

  return { currentStreak, longestStreak, totalContributions, lastContributionDate }
}

async function fetchCalendarDataFallback(username: string): Promise<CalendarWeek[] | null> {
  try {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json() as {
      contributions: { date: string; count: number; level: number }[]
    }
    if (!data || !Array.isArray(data.contributions)) return null

    const to = new Date()
    const from = new Date()
    from.setUTCFullYear(from.getUTCFullYear() - 1)
    
    const fromStr = from.toISOString().slice(0, 10)
    const toStr = to.toISOString().slice(0, 10)

    let filtered = data.contributions.filter(c => c.date >= fromStr && c.date <= toStr)
    if (!filtered.length) {
      filtered = data.contributions.slice(-365)
    }

    filtered.sort((a, b) => a.date.localeCompare(b.date))

    const weeks: CalendarWeek[] = []
    let currentWeekDays: CalendarDay[] = []

    if (filtered.length > 0) {
      const firstDate = new Date(filtered[0].date + 'T00:00:00Z')
      const firstDayOfWeek = firstDate.getUTCDay()
      if (firstDayOfWeek > 0) {
        for (let i = 0; i < firstDayOfWeek; i++) {
          const padDate = new Date(firstDate)
          padDate.setUTCDate(firstDate.getUTCDate() - (firstDayOfWeek - i))
          currentWeekDays.push({
            date: padDate.toISOString().slice(0, 10),
            contributionCount: 0
          })
        }
      }
    }

    for (const c of filtered) {
      currentWeekDays.push({
        date: c.date,
        contributionCount: c.count
      })

      if (currentWeekDays.length === 7) {
        weeks.push({ contributionDays: currentWeekDays })
        currentWeekDays = []
      }
    }

    if (currentWeekDays.length > 0) {
      const lastDate = new Date(currentWeekDays[currentWeekDays.length - 1].date + 'T00:00:00Z')
      const remaining = 7 - currentWeekDays.length
      for (let i = 1; i <= remaining; i++) {
        const padDate = new Date(lastDate)
        padDate.setUTCDate(lastDate.getUTCDate() + i)
        currentWeekDays.push({
          date: padDate.toISOString().slice(0, 10),
          contributionCount: 0
        })
      }
      weeks.push({ contributionDays: currentWeekDays })
    }

    return weeks
  } catch (error) {
    console.error('Fallback GitHub calendar fetch failed:', error)
    return null
  }
}

async function fetchCalendarData(): Promise<CalendarWeek[] | null> {
  const token = process.env.GITHUB_TOKEN
  const username = process.env.GITHUB_USERNAME || 'yaswanthme007'

  const isTokenValid = token && !token.includes('replace_with')

  if (!isTokenValid) {
    return fetchCalendarDataFallback(username)
  }

  const to = new Date()
  const from = new Date()
  from.setUTCFullYear(from.getUTCFullYear() - 1)

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Thamo-Portfolio',
      },
      body: JSON.stringify({
        query: `
          query($login: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $login) {
              contributionsCollection(from: $from, to: $to) {
                contributionCalendar {
                  totalContributions
                  weeks {
                    contributionDays {
                      date
                      contributionCount
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { login: username, from: from.toISOString(), to: to.toISOString() },
      }),
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      console.warn('GraphQL GitHub API call failed, attempting fallback...')
      return fetchCalendarDataFallback(username)
    }

    const payload = await response.json() as {
      data?: {
        user?: {
          contributionsCollection?: {
            contributionCalendar?: {
              totalContributions: number
              weeks?: CalendarWeek[]
            }
          }
        }
      }
    }

    const weeks = payload.data?.user?.contributionsCollection?.contributionCalendar?.weeks
    if (!weeks) {
      return fetchCalendarDataFallback(username)
    }
    return weeks
  } catch (err) {
    console.error('GraphQL API threw error, attempting fallback...', err)
    return fetchCalendarDataFallback(username)
  }
}

export async function getGitHubStats(): Promise<GitHubStats | null> {
  const weeks = await fetchCalendarData()
  if (!weeks) return null
  const days = weeks.flatMap(w => w.contributionDays ?? [])
  if (!days.length) return null
  return countStreak(days)
}

export async function getGitHubCalendar(): Promise<GitHubCalendar | null> {
  const weeks = await fetchCalendarData()
  if (!weeks) return null
  const days = weeks.flatMap(w => w.contributionDays ?? [])
  const totalContributions = days.reduce((s, d) => s + d.contributionCount, 0)
  return { weeks, totalContributions }
}

/* ────────────────────────────────────────────────────────────
   REPO STATS — stars, forks, primary language, last update.
   Used by project cards across home / work / detail pages.
   ──────────────────────────────────────────────────────────── */

export interface RepoStats {
  owner: string
  repo: string
  stars: number
  forks: number
  watchers: number
  language: string | null
  description: string | null
  htmlUrl: string
  pushedAt: string | null
}

/** Pull "owner/repo" out of a github.com URL. Returns null if it's not one. */
export function parseGitHubRepoUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url)
    if (!/github\.com$/i.test(u.hostname)) return null
    const parts = u.pathname.replace(/^\/+|\/+$/g, '').split('/')
    if (parts.length < 2) return null
    const owner = parts[0]
    const repo  = parts[1].replace(/\.git$/i, '')
    if (!owner || !repo) return null
    return { owner, repo }
  } catch {
    return null
  }
}

/* ────────────────────────────────────────────────────────────
   ACTIVITY FEED — recent public events from GitHub.
   ──────────────────────────────────────────────────────────── */

export type ActivityKind = 'push' | 'pr' | 'issue' | 'release' | 'star' | 'fork' | 'create' | 'other'

export interface ActivityCommit {
  sha: string
  message: string
  url: string
}

export interface ActivityEvent {
  id: string
  kind: ActivityKind
  /** Repo "owner/name" string */
  repo: string
  repoUrl: string
  /** Human action verb-phrase, e.g. "Pushed 3 commits", "Opened a pull request". */
  action: string
  /** Optional ref / branch / title text. */
  detail?: string
  url: string
  createdAt: string
  /** Only present for PushEvent. */
  commits?: ActivityCommit[]
}

function mapEvent(e: any): ActivityEvent | null {
  if (!e || !e.type || !e.repo) return null
  const repo    = e.repo.name as string
  const repoUrl = `https://github.com/${repo}`
  const base    = { id: String(e.id), repo, repoUrl, createdAt: e.created_at as string }

  switch (e.type) {
    case 'PushEvent': {
      const rawCommits = (e.payload?.commits ?? []) as any[]
      const commits = rawCommits.map((c: any) => ({
        sha: c.sha, message: c.message, url: `${repoUrl}/commit/${c.sha}`,
      })) as ActivityCommit[]
      // payload.size is the authoritative commit count — commits[] may be truncated or empty
      const count = typeof e.payload?.size === 'number' ? e.payload.size : commits.length
      const branch = (e.payload?.ref ?? '').replace(/^refs\/heads\//, '')
      return {
        ...base,
        kind: 'push',
        action: `Pushed ${count} commit${count === 1 ? '' : 's'}`,
        detail: branch ? `to ${branch}` : undefined,
        url: `${repoUrl}/commits/${branch || 'main'}`,
        commits,
      }
    }
    case 'PullRequestEvent': {
      const a = e.payload?.action ?? 'updated'
      const pr = e.payload?.pull_request
      return {
        ...base,
        kind: 'pr',
        action: `${a[0].toUpperCase() + a.slice(1)} pull request`,
        detail: pr?.title,
        url: pr?.html_url ?? `${repoUrl}/pulls`,
      }
    }
    case 'IssuesEvent': {
      const a = e.payload?.action ?? 'updated'
      const issue = e.payload?.issue
      return {
        ...base,
        kind: 'issue',
        action: `${a[0].toUpperCase() + a.slice(1)} an issue`,
        detail: issue?.title,
        url: issue?.html_url ?? `${repoUrl}/issues`,
      }
    }
    case 'ReleaseEvent': {
      const r = e.payload?.release
      return {
        ...base,
        kind: 'release',
        action: 'Published a release',
        detail: r?.name ?? r?.tag_name,
        url: r?.html_url ?? `${repoUrl}/releases`,
      }
    }
    case 'WatchEvent': {
      return { ...base, kind: 'star', action: 'Starred', url: repoUrl }
    }
    case 'ForkEvent': {
      return { ...base, kind: 'fork', action: 'Forked', url: e.payload?.forkee?.html_url ?? repoUrl }
    }
    case 'CreateEvent': {
      const t = e.payload?.ref_type
      return {
        ...base,
        kind: 'create',
        action: t === 'repository' ? 'Created a repository' : `Created ${t}`,
        detail: e.payload?.ref ?? undefined,
        url: repoUrl,
      }
    }
    default:
      return null
  }
}

/** Pull the latest public events for a GitHub user. Cached 5 min server-side. */
export async function getRecentActivity(limit = 12): Promise<ActivityEvent[]> {
  const token = process.env.GITHUB_TOKEN
  const username = process.env.GITHUB_USERNAME || 'yaswanthme007'
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Thamo-Portfolio',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(`https://api.github.com/users/${username}/events/public?per_page=${Math.min(30, limit * 2)}`, {
      headers,
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const list = await res.json() as any[]
    const mapped = list.map(mapEvent).filter(Boolean) as ActivityEvent[]
    return mapped.slice(0, limit)
  } catch {
    return []
  }
}

/** Fetch a single repo's public stats from the REST API. Cached for 1h via
    Next's fetch cache. Falls back to null on any failure. */
export async function getRepoStats(repoUrl: string): Promise<RepoStats | null> {
  const parsed = parseGitHubRepoUrl(repoUrl)
  if (!parsed) return null
  const { owner, repo } = parsed

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Thamo-Portfolio',
  }
  const token = process.env.GITHUB_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null

    const data = await res.json() as {
      stargazers_count?: number
      forks_count?: number
      watchers_count?: number
      language?: string | null
      description?: string | null
      html_url?: string
      pushed_at?: string | null
    }

    return {
      owner,
      repo,
      stars:       data.stargazers_count ?? 0,
      forks:       data.forks_count ?? 0,
      watchers:    data.watchers_count ?? 0,
      language:    data.language ?? null,
      description: data.description ?? null,
      htmlUrl:     data.html_url ?? `https://github.com/${owner}/${repo}`,
      pushedAt:    data.pushed_at ?? null,
    }
  } catch {
    return null
  }
}
