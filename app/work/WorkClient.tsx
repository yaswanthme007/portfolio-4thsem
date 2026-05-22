'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { RepoStars } from '@/components/RepoStars'
import type { AdminProject } from '@/lib/projects'

const FILTERS = ['All', 'React', 'Node', 'AI', 'Design'] as const
type Filter = typeof FILTERS[number]

export function WorkClient({ projects }: { projects: AdminProject[] }) {
  const [filter, setFilter] = useState<Filter>('All')

  const list = useMemo(() => {
    if (filter === 'All') return projects
    return projects.filter(p => p.tags.includes(filter))
  }, [projects, filter])

  const total = projects.length
  const shown = list.length

  return (
    <section className="page work-page">

      {/* ─── HERO ─── */}
      <header className="work-hero">
        <p className="work-hero-eyebrow">
          <span className="work-hero-mark" aria-hidden="true">§</span>
          Index of Work
        </p>
        <h1 className="work-hero-title">
          A small archive of <em>things I&rsquo;ve made</em>
        </h1>
        <p className="work-hero-lede">
          Each entry is a project I designed, built, or shipped &mdash; arranged
          by recency. Pull on whichever thread catches your eye.
        </p>

        <div className="work-hero-foot">
          <div className="work-filter-row" role="tablist" aria-label="Filter projects by tag">
            {FILTERS.map(f => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={`work-filter-btn ${filter === f ? 'is-active' : ''}`}
              >
                {f}
              </button>
            ))}
          </div>

          <p className="work-hero-count">
            <span className="work-hero-count-shown">{shown.toString().padStart(2, '0')}</span>
            <span className="work-hero-count-sep" aria-hidden="true">/</span>
            <span className="work-hero-count-total">{total.toString().padStart(2, '0')}</span>
            <span className="work-hero-count-label">
              {filter === 'All' ? 'projects' : `tagged ${filter}`}
            </span>
          </p>
        </div>
      </header>

      {/* ─── INDEX LIST ─── */}
      <ol className="work-index">
        {list.length === 0 && (
          <li className="work-empty">
            <p>No projects under <em>{filter}</em> yet. Try another tag.</p>
          </li>
        )}

        {list.map((p, i) => (
          <li
            key={p.id}
            className="work-entry fade-in"
            style={{ animationDelay: `${i * 0.05}s` } as React.CSSProperties}
          >
            <Link href={`/work/${p.slug}` as never} className="work-entry-link">
              <span className="work-entry-num" aria-hidden="true">№&nbsp;{p.index}</span>

              <div className="work-entry-body">
                <p className="work-entry-eyebrow">
                  <span className="work-entry-year">{p.year}</span>
                  <span className="work-entry-dot" aria-hidden="true">·</span>
                  <span className="work-entry-tags">
                    {p.tags.join(' · ')}
                  </span>
                  {p.repoUrl && (
                    <>
                      <span className="work-entry-dot" aria-hidden="true">·</span>
                      <RepoStars repoUrl={p.repoUrl} />
                    </>
                  )}
                </p>

                <h2 className="work-entry-title">{p.title}</h2>

                <p className="work-entry-desc">{p.description}</p>

                <div className="work-entry-foot">
                  <span className="work-entry-cta">
                    Read the case study <span aria-hidden="true">→</span>
                  </span>
                  {(p.repoUrl || p.liveUrl) && (
                    <div className="work-entry-pills">
                      {p.repoUrl && (
                        <button
                          type="button"
                          className="work-entry-pill"
                          onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            window.open(p.repoUrl, '_blank', 'noopener,noreferrer')
                          }}
                        >
                          GitHub
                        </button>
                      )}
                      {p.liveUrl && (
                        <button
                          type="button"
                          className="work-entry-pill work-entry-pill--live"
                          onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            window.open(p.liveUrl, '_blank', 'noopener,noreferrer')
                          }}
                        >
                          Live <span aria-hidden="true">↗</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      {/* ─── CLOSING ─── */}
      <footer className="work-foot">
        <span className="work-foot-line" aria-hidden="true" />
        <p className="work-foot-text">
          End of index. There&rsquo;s more in private &mdash;{' '}
          <Link href="/contact">say hello </Link>if you&rsquo;d like a look.
        </p>
      </footer>
    </section>
  )
}
