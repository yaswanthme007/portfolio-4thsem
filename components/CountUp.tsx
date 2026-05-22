'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  to: number
  duration?: number
  format?: (n: number) => string
  className?: string
}

/**
 * CountUp — animates from 0 to `to` once the element enters view.
 * Uses requestAnimationFrame with an ease-out cubic curve.
 */
export function CountUp({ to, duration = 1400, format, className }: Props) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !hasRun.current) {
        hasRun.current = true
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - t, 3)
          setValue(Math.round(eased * to))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.25 })

    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  return (
    <span ref={ref} className={className}>
      {format ? format(value) : value.toLocaleString()}
    </span>
  )
}
