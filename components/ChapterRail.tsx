'use client'

import { useEffect, useRef, useState } from 'react'

interface Chapter {
  id: string
  num: string
  label: string
}

interface Props {
  chapters: Chapter[]
}

/**
 * ChapterRail — sticky right-edge rail with section dots. Active section is
 * driven by IntersectionObserver. On click, we eagerly set the active state
 * and pause observer-driven updates for a short window so the dot doesn't
 * snap back if scrollIntoView can't reach viewport top (e.g. last section).
 */
export function ChapterRail({ chapters }: Props) {
  const [active, setActive] = useState<string>(chapters[0]?.id ?? '')
  /* Timestamp until which we ignore observer updates (set after a click). */
  const lockUntilRef = useRef<number>(0)

  useEffect(() => {
    const elements = chapters
      .map(c => document.getElementById(c.id))
      .filter((x): x is HTMLElement => x !== null)
    if (elements.length === 0) return

    const io = new IntersectionObserver(
      entries => {
        if (Date.now() < lockUntilRef.current) return
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-25% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    elements.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [chapters])

  function go(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    /* Lock the active state to this section for ~900ms so the observer
       can't override it during the smooth-scroll animation. */
    setActive(id)
    lockUntilRef.current = Date.now() + 900
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const activeIndex = Math.max(0, chapters.findIndex(c => c.id === active))
  const progress = chapters.length > 1 ? activeIndex / (chapters.length - 1) : 0

  return (
    <nav className="chapter-rail" aria-label="Page sections">
      <span className="chapter-rail-line" aria-hidden="true" />
      <span
        className="chapter-rail-line-fill"
        aria-hidden="true"
        style={{ transform: `scaleY(${progress})` }}
      />
      {chapters.map(c => (
        <button
          key={c.id}
          type="button"
          className={`chapter-rail-item ${active === c.id ? 'is-active' : ''}`}
          onClick={() => go(c.id)}
          aria-label={`Jump to ${c.label}`}
        >
          <span className="chapter-rail-text">
            <span className="chapter-rail-num">{c.num}</span>
            <span className="chapter-rail-label">{c.label}</span>
          </span>
          <span className="chapter-rail-dot" aria-hidden="true" />
        </button>
      ))}
    </nav>
  )
}
