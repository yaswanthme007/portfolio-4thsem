'use client'

import { useEffect, useRef, useState } from 'react'
import type { ActivityEvent, ActivityKind } from '@/lib/github'

interface Props {
  initial: ActivityEvent[]
  /** Polling interval in ms. Defaults to 90s. */
  intervalMs?: number
}

/** Max rows shown — kept small so the feed stays compact. */
const LIMIT = 4

const KIND_GLYPH: Record<ActivityKind, string> = {
  push: '↟', pr: '⤳', issue: '◍', release: '◆',
  star: '★', fork: '⑂', create: '+', other: '·',
}

/** Locale-stable absolute label from the ISO string — server/client agree. */
function isoLabel(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return iso
  const [, y, mo, d, h, mi] = m
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(d, 10)} ${MONTHS[parseInt(mo, 10) - 1]} ${y}, ${h}:${mi} UTC`
}

/** Relative-from-now ("2m ago"). Reads Date.now() — only call after mount. */
function relative(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)        return 'just now'
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604_800)   return `${Math.floor(diff / 86400)}d ago`
  if (diff < 2_592_000) return `${Math.floor(diff / 604_800)}w ago`
  return isoLabel(iso).split(',')[0]
}

/**
 * RecentActivity — a compact, minimal live GitHub feed: at most 4 rows,
 * no filters, no status bar, no expand. Each row links to GitHub. Still
 * polls in the background so it stays current.
 */
export function RecentActivity({ initial, intervalMs = 90_000 }: Props) {
  const [events, setEvents] = useState<ActivityEvent[]>(initial.slice(0, LIMIT))
  const [mounted, setMounted] = useState(false)
  const [, setTick] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    setMounted(true)
    return () => { mountedRef.current = false }
  }, [])

  /* Background refresh */
  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch('/api/github/activity', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json() as { events: ActivityEvent[] }
        if (!mountedRef.current) return
        setEvents((data.events ?? []).slice(0, LIMIT))
      } catch {
        /* ignore */
      }
    }
    const id = setInterval(refresh, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  /* Keep "2m ago" fresh */
  useEffect(() => {
    if (!mounted) return
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [mounted])

  return (
    <ul className="activity-list">
      {events.map(ev => (
        <li key={ev.id} className="activity-row">
          <a
            href={ev.url}
            target="_blank"
            rel="noreferrer"
            className="activity-row-link"
          >
            <span className="activity-kind" aria-hidden="true">{KIND_GLYPH[ev.kind]}</span>
            <span className="activity-action">
              {ev.action}
              {ev.detail && (
                <span className="activity-action-detail"> {ev.detail.replace(/^to /, '')}</span>
              )}
            </span>
            <span className="activity-repo">{ev.repo}</span>
            <span
              className="activity-when"
              title={isoLabel(ev.createdAt)}
              suppressHydrationWarning
            >
              {mounted ? relative(ev.createdAt) : isoLabel(ev.createdAt).split(',')[0]}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
