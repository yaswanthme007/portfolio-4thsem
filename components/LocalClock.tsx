'use client'

import { useEffect, useState } from 'react'

interface Props {
  /** IANA timezone, e.g. "Asia/Kolkata". */
  timezone?: string
  /** Label shown beside the time, e.g. "Chennai". */
  label?: string
}

/**
 * LocalClock — ticking HH:MM:SS in the given timezone.
 * Renders nothing until hydrated to avoid SSR/CSR clock mismatch.
 */
export function LocalClock({ timezone = 'Asia/Kolkata', label = 'Chennai' }: Props) {
  const [now, setNow] = useState<string | null>(null)

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    })
    const tick = () => setNow(fmt.format(new Date()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [timezone])

  return (
    <span className="local-clock" suppressHydrationWarning>
      <span className="local-clock-dot" aria-hidden="true" />
      <span className="local-clock-label">{label}</span>
      <span className="local-clock-time">{now ?? '— : — : —'}</span>
    </span>
  )
}
