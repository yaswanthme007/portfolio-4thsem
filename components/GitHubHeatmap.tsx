'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import type { CalendarWeek } from '@/lib/github'

interface Props {
  weeks: CalendarWeek[]
  totalContributions: number
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function cellColor(count: number): string {
  if (count <= 0) return 'var(--hm-0)'
  if (count <= 2) return 'var(--hm-1)'
  if (count <= 5) return 'var(--hm-2)'
  if (count <= 10) return 'var(--hm-3)'
  return 'var(--hm-4)'
}

function formatLong(dateStr: string) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(dateStr))
}

function relativeFromNow(dateStr: string | null): string {
  if (!dateStr) return '—'
  const now = new Date()
  const then = new Date(dateStr)
  const diff = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return 'today'
  if (diff === 1) return 'yesterday'
  if (diff < 7) return `${diff} days ago`
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`
  return `${Math.floor(diff / 365)}y ago`
}

function computeStats(weeks: CalendarWeek[]) {
  const days = weeks.flatMap(w => w.contributionDays)
  let currentStreak = 0
  let longestStreak = 0
  let run = 0
  let lastActive: string | null = null

  for (const day of days) {
    if (day.contributionCount > 0) {
      run += 1
      longestStreak = Math.max(longestStreak, run)
      lastActive = day.date
    } else {
      run = 0
    }
  }

  // Walk backwards from latest day for current streak
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) currentStreak += 1
    else break
  }

  return { currentStreak, longestStreak, lastActive }
}

function monthLabelPositions(weeks: CalendarWeek[]) {
  // For each week, look at the first day; emit month label only when month changes
  const out: { idx: number; label: string }[] = []
  let lastMonth = -1
  weeks.forEach((week, idx) => {
    const first = week.contributionDays[0]
    if (!first) return
    const m = new Date(first.date).getMonth()
    if (m !== lastMonth) {
      out.push({ idx, label: MONTHS[m] })
      lastMonth = m
    }
  })
  return out
}

export function GitHubHeatmap({ weeks, totalContributions }: Props) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { currentStreak, longestStreak, lastActive } = useMemo(() => computeStats(weeks), [weeks])
  const monthLabels = useMemo(() => monthLabelPositions(weeks), [weeks])

  /* Scroll to the right end on mount so the most recent week is in view.
     Wrapped in requestAnimationFrame so the cells have measured their width
     before we set scrollLeft, and `behavior: 'instant'` bypasses the
     site-wide smooth-scroll declared on <html>. We try a few frames in case
     fonts/images shift width late. */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let cancelled = false

    function jump() {
      if (cancelled || !el) return
      el.scrollTo({ left: el.scrollWidth, behavior: 'instant' as ScrollBehavior })
    }

    // First on next frame, then once layout settles, then once more after
    // fonts/icons have loaded. Cheap and bulletproof.
    requestAnimationFrame(jump)
    const t1 = setTimeout(jump, 60)
    const t2 = setTimeout(jump, 300)

    return () => {
      cancelled = true
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [weeks])

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-header">
        <div className="heatmap-title-block">
          <h3 className="heatmap-title">GitHub Activity</h3>
          <span className="heatmap-sub">
            {totalContributions.toLocaleString()} contributions in the last year
            {lastActive && <> · last commit {relativeFromNow(lastActive)}</>}
          </span>
        </div>
        <div className="heatmap-stats">
          <div className="heatmap-stat">
            <span className="heatmap-stat-value">{currentStreak}</span>
            <span className="heatmap-stat-label">Day Streak</span>
          </div>
          <div className="heatmap-stat">
            <span className="heatmap-stat-value">{longestStreak}</span>
            <span className="heatmap-stat-label">Longest</span>
          </div>
          <div className="heatmap-stat">
            <span className="heatmap-stat-value">{totalContributions.toLocaleString()}</span>
            <span className="heatmap-stat-label">Total</span>
          </div>
        </div>
      </div>

      <div className="heatmap-scroll" ref={scrollRef} onMouseLeave={() => setTooltip(null)}>
        <div style={{ minWidth: 'max-content' }}>
          <div className="heatmap-months">
            {(() => {
              const cells: React.ReactElement[] = []
              for (let i = 0; i < weeks.length; i++) {
                const found = monthLabels.find(m => m.idx === i)
                cells.push(
                  <span
                    key={i}
                    className="heatmap-month-label"
                    style={{ width: 15, display: 'inline-block' }}
                  >
                    {found ? found.label : ''}
                  </span>
                )
              }
              return cells
            })()}
          </div>

          <div className="heatmap-inner">
            <div className="heatmap-day-labels">
              {DAY_LABELS.map((d, i) => (
                <span key={i} className="heatmap-day-label">{d}</span>
              ))}
            </div>

            <div className="heatmap-grid">
              {weeks.map((week, wi) => (
                <div key={wi} className="heatmap-col">
                  {week.contributionDays.map((day, di) => (
                    <div
                      key={di}
                      className="heatmap-cell"
                      style={{ background: cellColor(day.contributionCount) }}
                      role="img"
                      aria-label={`${day.contributionCount} contribution${day.contributionCount !== 1 ? 's' : ''} on ${formatLong(day.date)}`}
                      title={`${day.contributionCount} contribution${day.contributionCount !== 1 ? 's' : ''} · ${formatLong(day.date)}`}
                      onMouseEnter={e => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        setTooltip({
                          text: `${day.contributionCount} contribution${day.contributionCount !== 1 ? 's' : ''} · ${formatLong(day.date)}`,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 8,
                        })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      onTouchStart={e => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        setTooltip({
                          text: `${day.contributionCount} · ${formatLong(day.date)}`,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 8,
                        })
                      }}
                      onTouchEnd={() => setTimeout(() => setTooltip(null), 1500)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="heatmap-footer">
        <span>One year · pulled live from GitHub</span>
        <div className="heatmap-legend">
          <span className="heatmap-legend-label">Less</span>
          {[0, 2, 5, 8, 12].map(n => (
            <div key={n} className="heatmap-legend-cell" style={{ background: cellColor(n) }} />
          ))}
          <span className="heatmap-legend-label">More</span>
        </div>
      </div>

      {tooltip && (
        <div className="heatmap-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
