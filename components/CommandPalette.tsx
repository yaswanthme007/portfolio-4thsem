'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type CommandItem = {
  id: string
  title: string
  subtitle?: string
  group: string
  href?: string
  external?: boolean
  action?: () => void
  keywords?: string
  icon: 'home' | 'work' | 'about' | 'contact' | 'services' | 'resume' | 'certs' | 'theme' | 'external' | 'project' | 'admin'
}

const ICONS: Record<CommandItem['icon'], React.ReactElement> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
  ),
  work: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  about: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  ),
  contact: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16v16H4z" /><path d="M4 7l8 6 8-6" />
    </svg>
  ),
  services: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
  resume: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" />
    </svg>
  ),
  certs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="9" r="6" /><path d="M8.2 13.4L7 21l5-3 5 3-1.2-7.6" />
    </svg>
  ),
  theme: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  external: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4h6v6M20 4l-9 9M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" />
    </svg>
  ),
  project: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12l9-9 9 9-9 9z" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
}

type ProjectLite = { title: string; slug: string; description: string }

export function CommandPalette({ projects = [] }: { projects?: ProjectLite[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const allItems = useMemo<CommandItem[]>(() => {
    const pages: CommandItem[] = [
      { id: 'p:home',     group: 'Pages', title: 'Home',         subtitle: 'Hero, contributions, intro', href: '/',             icon: 'home' },
      { id: 'p:work',     group: 'Pages', title: 'Work',         subtitle: 'Selected projects',          href: '/work',         icon: 'work' },
      { id: 'p:about',    group: 'Pages', title: 'About',        subtitle: 'Background, stack, timeline',href: '/about',        icon: 'about' },
      { id: 'p:services', group: 'Pages', title: 'Services',     subtitle: 'What I offer',               href: '/services',     icon: 'services' },
      { id: 'p:certs',    group: 'Pages', title: 'Certificates', subtitle: 'Credentials & proofs',       href: '/certificates', icon: 'certs' },
      { id: 'p:contact',  group: 'Pages', title: 'Contact',      subtitle: 'Reach out',                   href: '/contact',      icon: 'contact' },
    ]
    const actions: CommandItem[] = [
      { id: 'a:resume',   group: 'Actions', title: 'Open Resume',     subtitle: 'Latest PDF in a new tab', href: '/api/resume', external: true, icon: 'resume' },
      { id: 'a:admin',    group: 'Actions', title: 'Admin Dashboard', subtitle: 'Sign in to manage content', href: '/dashboard-yaswanth/login', icon: 'admin', keywords: 'admin login dashboard manage' },
      { id: 'a:theme',    group: 'Actions', title: 'Toggle Theme',    subtitle: 'Light / Dark', icon: 'theme',
        action: () => {
          const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
          document.documentElement.setAttribute('data-theme', cur)
          try { localStorage.setItem('theme', cur) } catch {}
        } },
      { id: 'a:keys',     group: 'Actions', title: 'Keyboard Shortcuts', subtitle: 'Press ? to open',  icon: 'theme', keywords: 'keyboard shortcuts hotkeys help ?',
        action: () => {
          /* Dispatch a synthetic ? keydown so the global KeyboardShortcuts
             listener opens the overlay. */
          window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
        } },
      { id: 'a:github',   group: 'Actions', title: 'GitHub',          subtitle: 'Open GitHub profile',  href: 'https://github.com/yaswanthme007', external: true, icon: 'external' },
      { id: 'a:linkedin', group: 'Actions', title: 'LinkedIn',        subtitle: 'Open LinkedIn profile', href: 'https://www.linkedin.com/in/kbyaswanth', external: true, icon: 'external' },
    ]
    const projectItems: CommandItem[] = projects.map(p => ({
      id: `proj:${p.slug}`,
      group: 'Projects',
      title: p.title,
      subtitle: p.description.slice(0, 90),
      href: `/work/${p.slug}`,
      icon: 'project',
      keywords: p.description,
    }))
    return [...pages, ...projectItems, ...actions]
  }, [projects])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allItems
    return allItems.filter(item => {
      const haystack = `${item.title} ${item.subtitle ?? ''} ${item.keywords ?? ''} ${item.group}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [query, allItems])

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    filtered.forEach(item => {
      if (!map.has(item.group)) map.set(item.group, [])
      map.get(item.group)!.push(item)
    })
    return Array.from(map.entries())
  }, [filtered])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    function onOpenEvent() { setOpen(true) }
    window.addEventListener('cmdk:open', onOpenEvent)
    return () => window.removeEventListener('cmdk:open', onOpenEvent)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 0)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => { setSelected(0) }, [query])

  function runItem(item: CommandItem) {
    setOpen(false)
    if (item.action) { item.action(); return }
    if (!item.href) return
    if (item.external) { window.open(item.href, '_blank', 'noopener,noreferrer'); return }
    router.push(item.href as never)
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(s => Math.min(filtered.length - 1, s + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(s => Math.max(0, s - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = filtered[selected]
      if (item) runItem(item)
    }
  }

  if (!open) return null

  return (
    <div
      className="cmdk-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div className="cmdk-modal" onKeyDown={onListKeyDown}>
        <div className="cmdk-input-wrap">
          <svg className="cmdk-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
          <input
            ref={inputRef}
            className="cmdk-input"
            aria-label="Search pages, projects, and actions"
            placeholder="Search pages, projects, actions…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <span className="cmdk-input-hint">ESC</span>
        </div>

        <div className="cmdk-list">
          {filtered.length === 0 && (
            <p className="cmdk-empty">No matches for &ldquo;{query}&rdquo;.</p>
          )}
          {grouped.map(([groupName, items]) => (
            <div key={groupName}>
              <div className="cmdk-group-label">{groupName}</div>
              {items.map(item => {
                const idx = filtered.indexOf(item)
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="cmdk-item"
                    data-selected={idx === selected || undefined}
                    onMouseEnter={() => setSelected(idx)}
                    onClick={() => runItem(item)}
                  >
                    <span className="cmdk-item-icon">{ICONS[item.icon]}</span>
                    <span className="cmdk-item-text">
                      <span className="cmdk-item-title">{item.title}</span>
                      {item.subtitle && <span className="cmdk-item-sub">{item.subtitle}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="cmdk-footer">
          <span>Command palette</span>
          <span className="cmdk-footer-keys">
            <span className="cmdk-footer-kbd"><kbd>↑↓</kbd>navigate</span>
            <span className="cmdk-footer-kbd"><kbd>↵</kbd>open</span>
            <span className="cmdk-footer-kbd"><kbd>esc</kbd>close</span>
          </span>
        </div>
      </div>
    </div>
  )
}
