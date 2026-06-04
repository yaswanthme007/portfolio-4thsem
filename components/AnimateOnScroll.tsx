'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function AnimateOnScroll() {
  const pathname = usePathname()

  // Re-run reveal logic on every route change
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('.home-section')
    )

    if (sections.length === 0) {
      // No home sections on this page — ensure reveal CSS is off
      document.body.classList.remove('js-reveal-ready')
      return
    }

    // Pre-mark sections already in the viewport so they're never hidden
    sections.forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        el.classList.add('is-visible')
      }
    })

    // Enable the reveal CSS — only sections without is-visible will be hidden
    document.body.classList.add('js-reveal-ready')

    // Observe the rest
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.06, rootMargin: '0px 0px -40px 0px' }
    )

    sections
      .filter(el => !el.classList.contains('is-visible'))
      .forEach(el => observer.observe(el))

    return () => {
      observer.disconnect()
      document.body.classList.remove('js-reveal-ready')
    }
  }, [pathname])

  // Nav scrolled-state — persists across routes, set up once
  useEffect(() => {
    const nav = document.querySelector('.nav')
    const syncNav = () =>
      nav?.classList.toggle('nav--scrolled', window.scrollY > 40)
    window.addEventListener('scroll', syncNav, { passive: true })
    syncNav()
    return () => window.removeEventListener('scroll', syncNav)
  }, [])

  return null
}
