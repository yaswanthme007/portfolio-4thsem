'use client'

import { useEffect } from 'react'

/**
 * HackathonParallax — drifts each .hackathon-image slower than scroll by
 * writing a --parallax-y CSS var consumed in globals.css. rAF-throttled,
 * transform-only (no layout thrash), same passive-listener lifecycle
 * shape as ChapterRail's IntersectionObserver.
 */
export function HackathonParallax() {
  useEffect(() => {
    const images = Array.from(document.querySelectorAll<HTMLElement>('.hackathon-image'))
    if (images.length === 0) return

    let ticking = false

    function update() {
      const viewportCenter = window.innerHeight / 2
      images.forEach(img => {
        const rect = img.getBoundingClientRect()
        const imageCenter = rect.top + rect.height / 2
        const offset = viewportCenter - imageCenter
        img.style.setProperty('--parallax-y', `${offset * 0.15}px`)
      })
      ticking = false
    }

    function onScroll() {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return null
}
