'use client'

import { useRef, type MouseEvent, type ReactNode } from 'react'
import Link from 'next/link'

interface Props {
  href: string
  className?: string
  children: ReactNode
  external?: boolean
  /** Magnetic pull strength in px. Default 8. */
  pull?: number
}

/**
 * MagneticButton — a button/link that gently leans toward the cursor.
 * Pull strength is moderate so it stays tasteful, not gimmicky.
 */
export function MagneticButton({
  href, className = '', children, external = false, pull = 8,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    el.style.setProperty('--magx', `${(dx * pull).toFixed(2)}px`)
    el.style.setProperty('--magy', `${(dy * pull).toFixed(2)}px`)
  }

  function onLeave() {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--magx', '0px')
    el.style.setProperty('--magy', '0px')
  }

  const inner = <span className="magnetic-inner">{children}</span>

  return (
    <div
      ref={ref}
      className="magnetic-wrap"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {external ? (
        <a href={href} className={`magnetic ${className}`} target="_blank" rel="noreferrer">
          {inner}
        </a>
      ) : (
        <Link href={href as never} className={`magnetic ${className}`}>{inner}</Link>
      )}
    </div>
  )
}
