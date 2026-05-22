'use client'

import { useEffect, useState } from 'react'

interface Props {
  phrases: string[]
  /** ms between swaps. Default 3200. */
  interval?: number
}

/**
 * RotatingTagline — crossfades through a list of taglines.
 * The container's width is locked to the longest phrase via a hidden ghost span,
 * so the surrounding layout doesn't reflow as phrases swap.
 */
export function RotatingTagline({ phrases, interval = 3200 }: Props) {
  const [idx, setIdx] = useState(0)
  const [out, setOut] = useState(false)
  const longest = phrases.reduce((a, b) => (b.length > a.length ? b : a), phrases[0] ?? '')

  useEffect(() => {
    if (phrases.length < 2) return
    const id = setInterval(() => {
      setOut(true)
      setTimeout(() => {
        setIdx(i => (i + 1) % phrases.length)
        setOut(false)
      }, 380)
    }, interval)
    return () => clearInterval(id)
  }, [phrases, interval])

  return (
    <span className="rotating-tag-wrap">
      <span className="rotating-tag-ghost" aria-hidden="true">{longest}</span>
      <span className={`rotating-tag ${out ? 'is-out' : ''}`}>
        {phrases[idx]}
      </span>
    </span>
  )
}
