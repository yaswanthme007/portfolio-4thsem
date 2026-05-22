'use client'

import { useEffect, useState } from 'react'

interface RepoStats {
  owner: string
  repo: string
  stars: number
  forks: number
  language: string | null
}

interface Props {
  repoUrl: string
  /** Visual variant.
   *  - 'inline' (default): compact "★ 42 · ⑂ 8" line for use in eyebrows.
   *  - 'block': larger statline with language label. */
  variant?: 'inline' | 'block'
  /** Optional className passed through to the outer span. */
  className?: string
}

function format(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k'
  return String(n)
}

/**
 * RepoStars — fetches live stars / forks for a GitHub repo URL and renders
 * a small statline. Renders an unobtrusive placeholder during the fetch so
 * the surrounding layout doesn't jump. Silently renders nothing on failure.
 */
export function RepoStars({ repoUrl, variant = 'inline', className = '' }: Props) {
  const [stats, setStats] = useState<RepoStats | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/github/repo?url=${encodeURIComponent(repoUrl)}`)
        if (!res.ok) { if (!cancelled) setFailed(true); return }
        const data = await res.json()
        if (!cancelled) setStats(data)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    load()
    return () => { cancelled = true }
  }, [repoUrl])

  if (failed) return null

  if (!stats) {
    return (
      <span className={`repo-stars repo-stars--${variant} is-loading ${className}`} aria-hidden="true">
        <span className="repo-stars-skeleton" />
      </span>
    )
  }

  return (
    <span
      className={`repo-stars repo-stars--${variant} ${className}`}
      aria-label={`${stats.stars} stars and ${stats.forks} forks on GitHub`}
    >
      <span className="repo-stars-item" title={`${stats.stars} stargazers`}>
        <span className="repo-stars-icon" aria-hidden="true">★</span>
        <span className="repo-stars-value">{format(stats.stars)}</span>
      </span>
      <span className="repo-stars-sep" aria-hidden="true">·</span>
      <span className="repo-stars-item" title={`${stats.forks} forks`}>
        <span className="repo-stars-icon" aria-hidden="true">⑂</span>
        <span className="repo-stars-value">{format(stats.forks)}</span>
      </span>
      {variant === 'block' && stats.language && (
        <>
          <span className="repo-stars-sep" aria-hidden="true">·</span>
          <span className="repo-stars-lang">{stats.language}</span>
        </>
      )}
    </span>
  )
}
