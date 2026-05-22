'use client'

interface Props {
  items: string[]
  /** Reverse direction (for a second row). */
  reverse?: boolean
}

/**
 * SkillsMarquee — infinitely scrolling row of skill/tool names.
 * Pauses on hover. Animation is pure CSS (translateX), no JS needed.
 * Duplicates the list to make the loop seamless.
 */
export function SkillsMarquee({ items, reverse = false }: Props) {
  return (
    <div className={`skills-marquee ${reverse ? 'skills-marquee--reverse' : ''}`}>
      <div className="skills-marquee-track">
        {[...items, ...items].map((item, i) => (
          <span key={`${item}-${i}`} className="skills-marquee-item">
            <span className="skills-marquee-mark" aria-hidden="true">✦</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
