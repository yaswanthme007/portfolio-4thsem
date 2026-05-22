'use client'

import { useEffect, useState } from 'react'

const ROLES = [
  'Software Developer',
  'Full-Stack Engineer',
  'Frontend Engineer (React)',
  'Backend Engineer (Node.js)',
]

export function Typewriter() {
  const [text,     setText]     = useState('')
  const [deleting, setDeleting] = useState(false)
  const [idx,      setIdx]      = useState(0)

  useEffect(() => {
    const role  = ROLES[idx]
    let   timer: ReturnType<typeof setTimeout>

    if (!deleting && text === role) {
      timer = setTimeout(() => setDeleting(true), 2600)
    } else if (deleting && text === '') {
      setDeleting(false)
      setIdx(i => (i + 1) % ROLES.length)
    } else {
      timer = setTimeout(
        () => setText(p => deleting ? p.slice(0, -1) : role.slice(0, p.length + 1)),
        deleting ? 30 : 72,
      )
    }
    return () => clearTimeout(timer)
  }, [text, deleting, idx])

  return (
    <p className="hero-role">
      {text}<span className="cursor" aria-hidden="true" />
    </p>
  )
}
