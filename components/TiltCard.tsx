'use client'

import { useRef, type MouseEvent, type ReactNode } from 'react'

interface Props {
  className?: string
  children: ReactNode
  /** Max tilt angle in degrees. Default 6°. */
  max?: number
  /** Optional href; if provided, wraps in <a>. */
  href?: string
}

/**
 * TiltCard — gives any block a subtle 3D tilt that tracks the cursor.
 * Uses CSS variables (--tx, --ty) consumed by globals.css.
 * Resets to flat on leave.
 */
export function TiltCard({ className = '', children, max = 6, href }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--tx', `${(-py * max).toFixed(2)}deg`)
    el.style.setProperty('--ty', `${(px * max).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`)
  }

  function onLeave() {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--tx', '0deg')
    el.style.setProperty('--ty', '0deg')
  }

  const content = (
    <div
      ref={ref}
      className={`tilt-card ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="tilt-card-inner">{children}</div>
    </div>
  )

  if (href) {
    return <a href={href} className="tilt-card-link">{content}</a>
  }
  return content
}
