'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Theme = 'dark' | 'light'

interface Shortcut {
  group: 'Navigation' | 'Actions'
  keys: string[]
  label: string
}

const SHORTCUTS: Shortcut[] = [
  { group: 'Actions',    keys: ['⌘', 'K'], label: 'Open the command palette' },
  { group: 'Actions',    keys: ['T'],      label: 'Toggle light / dark theme' },
  { group: 'Actions',    keys: ['?'],      label: 'Open this shortcuts overlay' },
  { group: 'Actions',    keys: ['Esc'],    label: 'Close overlays' },
  { group: 'Navigation', keys: ['G', 'H'], label: 'Go to Home' },
  { group: 'Navigation', keys: ['G', 'W'], label: 'Go to Work' },
  { group: 'Navigation', keys: ['G', 'A'], label: 'Go to About' },
  { group: 'Navigation', keys: ['G', 'S'], label: 'Go to Services' },
  { group: 'Navigation', keys: ['G', 'C'], label: 'Go to Contact' },
]

const GO_MAP: Record<string, string> = {
  h: '/',
  w: '/work',
  a: '/about',
  s: '/services',
  c: '/contact',
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return false
}

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return (document.documentElement.getAttribute('data-theme') as Theme) ?? 'light'
}

function toggleTheme() {
  const next: Theme = readTheme() === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  try { localStorage.setItem('theme', next) } catch {}
}

export function KeyboardShortcuts() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  /* Tracks a g-prefix press; cleared after ~1500ms or after the next key. */
  const [pendingG, setPendingG] = useState(false)

  useEffect(() => {
    let gTimer: ReturnType<typeof setTimeout> | null = null

    function onKey(e: KeyboardEvent) {
      // Don't intercept anything while the user is typing
      if (isTypingTarget(e.target)) return

      // ? — open overlay (Shift + / on most keyboards)
      if (e.key === '?') {
        e.preventDefault()
        setOpen(true)
        return
      }

      // Esc — close overlay (only handle here when overlay is open)
      if (e.key === 'Escape' && open) {
        setOpen(false)
        return
      }

      // While overlay is open, swallow other shortcuts to avoid surprises
      if (open) return

      // ⌘/Ctrl + K is handled by CommandPalette — don't double-handle

      // T — toggle theme
      if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        toggleTheme()
        return
      }

      // g-prefix navigation: g, then h/w/a/s/c
      if ((e.key === 'g' || e.key === 'G') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setPendingG(true)
        if (gTimer) clearTimeout(gTimer)
        gTimer = setTimeout(() => setPendingG(false), 1500)
        return
      }

      if (pendingG) {
        const key = e.key.toLowerCase()
        const target = GO_MAP[key]
        if (target) {
          e.preventDefault()
          setPendingG(false)
          if (gTimer) clearTimeout(gTimer)
          router.push(target as never)
          return
        }
        // unknown key while g pending — clear
        setPendingG(false)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (gTimer) clearTimeout(gTimer)
    }
  }, [open, pendingG, router])

  // Group shortcuts for display
  const grouped: Record<string, Shortcut[]> = {}
  for (const s of SHORTCUTS) {
    if (!grouped[s.group]) grouped[s.group] = []
    grouped[s.group].push(s)
  }

  return (
    <>
      {/* "G" pressed indicator — tiny chip in bottom-right */}
      {pendingG && (
        <div className="kbd-pending" role="status" aria-live="polite">
          <kbd className="kbd-pending-key">g</kbd>
          <span className="kbd-pending-text">then h / w / a / s / c</span>
        </div>
      )}

      {/* Shortcuts overlay */}
      {open && (
        <div
          className="kbd-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          onClick={() => setOpen(false)}
        >
          <div
            className="kbd-panel"
            onClick={e => e.stopPropagation()}
          >
            <header className="kbd-panel-head">
              <p className="kbd-panel-eyebrow">
                <span className="kbd-panel-mark">§</span> Keyboard shortcuts
              </p>
              <h2 className="kbd-panel-title">
                Things you can do <em>without a mouse</em>
              </h2>
              <button
                type="button"
                className="kbd-panel-close"
                onClick={() => setOpen(false)}
                aria-label="Close shortcuts"
              >
                ×
              </button>
            </header>

            <div className="kbd-panel-body">
              {Object.entries(grouped).map(([group, list]) => (
                <section key={group} className="kbd-group">
                  <p className="kbd-group-label">{group}</p>
                  <ul className="kbd-list">
                    {list.map(s => (
                      <li key={s.label} className="kbd-row">
                        <span className="kbd-keys">
                          {s.keys.map((k, i) => (
                            <span key={i} className="kbd-key-wrap">
                              {i > 0 && <span className="kbd-key-then">then</span>}
                              <kbd className="kbd-key">{k}</kbd>
                            </span>
                          ))}
                        </span>
                        <span className="kbd-label">{s.label}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <footer className="kbd-panel-foot">
              <span>Press <kbd className="kbd-key">Esc</kbd> to close</span>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}
