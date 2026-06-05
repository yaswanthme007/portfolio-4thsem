'use client'

import { useEffect, useRef, useState } from 'react'
import type { ActivityEvent, ActivityKind } from '@/lib/github'

interface Props {
  initial: ActivityEvent[]
  intervalMs?: number
}

const LIMIT = 4

const KIND_GLYPH: Record<ActivityKind, string> = {
  push: '↟', pr: '⤳', issue: '◍', release: '◆',
  star: '★', fork: '⑂', create: '+', other: '·',
}

function isoLabel(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return iso
  const [, y, mo, d, h, mi] = m
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(d, 10)} ${MONTHS[parseInt(mo, 10) - 1]} ${y}, ${h}:${mi} UTC`
}

function relative(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)        return 'just now'
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604_800)   return `${Math.floor(diff / 86400)}d ago`
  if (diff < 2_592_000) return `${Math.floor(diff / 604_800)}w ago`
  return isoLabel(iso).split(',')[0]
}

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

  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch('/api/github/activity', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json() as { events: ActivityEvent[] }
        if (!mountedRef.current) return
        setEvents((data.events ?? []).slice(0, LIMIT))
      } catch { /* ignore */ }
    }
    const id = setInterval(refresh, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  useEffect(() => {
    if (!mounted) return
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [mounted])

  if (events.length === 0) {
    return (
      <div className="activity-empty">
        <span>No recent public activity found.</span>
      </div>
    )
  }

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
            <span className="activity-body">
              <span className="activity-action">
                {ev.action}
                {ev.detail && (
                  <span className="activity-action-detail"> {ev.detail.replace(/^to /, '')}</span>
                )}
              </span>
              {/* Show commit messages for push events */}
              {ev.kind === 'push' && ev.commits && ev.commits.length > 0 && (
                <span className="activity-commits">
                  {ev.commits.slice(0, 2).map(c => (
                    <span key={c.sha} className="activity-commit-msg">
                      <span className="activity-commit-sha">{c.sha.slice(0, 7)}</span>
                      {' '}
                      {c.message.split('\n')[0].slice(0, 72)}
                    </span>
                  ))}
                  {ev.commits.length > 2 && (
                    <span className="activity-commit-more">
                      +{ev.commits.length - 2} more
                    </span>
                  )}
                </span>
              )}
            </span>
            <span className="activity-repo">{ev.repo.split('/')[1] ?? ev.repo}</span>
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
