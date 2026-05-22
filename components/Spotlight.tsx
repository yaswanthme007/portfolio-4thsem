'use client'

import { useEffect, useRef } from 'react'

/**
 * Spotlight — a soft warm glow that follows the cursor inside its container.
 * Renders an absolutely-positioned div; the parent must be `position: relative`
 * and `overflow: hidden`. Uses --sx/--sy CSS vars so the actual gradient lives
 * in globals.css and respects the active theme.
 */
export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const parent = el.parentElement
    if (!parent) return

    function onMove(e: MouseEvent) {
      const r = parent!.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * 100
      const y = ((e.clientY - r.top) / r.height) * 100
      el!.style.setProperty('--sx', `${x}%`)
      el!.style.setProperty('--sy', `${y}%`)
      el!.style.setProperty('--so', '1')
    }
    function onLeave() {
      el!.style.setProperty('--so', '0')
    }
    parent.addEventListener('mousemove', onMove)
    parent.addEventListener('mouseleave', onLeave)
    return () => {
      parent.removeEventListener('mousemove', onMove)
      parent.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return <div ref={ref} className="hero-spotlight" aria-hidden="true" />
}
