'use client'

import { useEffect, useRef } from 'react'

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return

    function update() {
      const doc = document.documentElement
      const scrolled = doc.scrollTop || document.body.scrollTop
      const total = doc.scrollHeight - doc.clientHeight
      const pct = total > 0 ? scrolled / total : 0
      bar!.style.transform = `scaleX(${pct})`
    }

    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div className="scroll-progress-track" aria-hidden="true">
      <div ref={barRef} className="scroll-progress-bar" />
    </div>
  )
}
