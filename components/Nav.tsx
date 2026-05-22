'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Route } from 'next'
import { ThemeToggle } from './ThemeToggle'

const LINKS: { href: Route; label: string }[] = [
  { href: '/',         label: 'Home' },
  { href: '/work',     label: 'Work' },
  { href: '/about',    label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/contact',  label: 'Contact' },
]

export function Nav() {
  const path = usePathname()
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || ''))
    }
  }, [])

  function openPalette() {
    window.dispatchEvent(new CustomEvent('cmdk:open'))
  }

  return (
    <nav className="nav" aria-label="Primary">
      <div className="nav-links">
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`nav-link${path === href || (href !== '/' && path.startsWith(href)) ? ' nav-link--active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <span className="nav-divider" aria-hidden="true" />
      <div className="nav-actions">
        <button
          type="button"
          className="nav-icon-btn nav-search-btn"
          onClick={openPalette}
          aria-label="Open command palette"
          title={`Search (${isMac ? '⌘' : 'Ctrl'} K)`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
        </button>
        <button
          type="button"
          className="nav-kbd"
          onClick={openPalette}
          aria-label="Open command palette"
        >
          {isMac ? '⌘' : 'Ctrl'} K
        </button>
        <ThemeToggle />
      </div>
    </nav>
  )
}
