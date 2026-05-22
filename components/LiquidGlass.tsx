'use client'

import {
  useRef,
  type ElementType,
  type ComponentPropsWithoutRef,
  type MouseEvent,
} from 'react'

type LGProps<T extends ElementType = 'div'> = {
  as?: T
  intensity?: 'low' | 'medium' | 'high'
  interactive?: boolean
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as'>

/**
 * LiquidGlass — Apple visionOS-style physical glass surface.
 *
 * 5 physical layers:
 *  ① backdrop-filter  blur + saturate + brighten   frosted base
 *  ② rgba background  ~7% white tint               glass body
 *  ③ box-shadow       8-layer specular system       physical lighting
 *  ④ ::before         radial-gradient at --mx/--my  caustic mouse shimmer
 *  ⑤ ::after          SVG feTurbulence grain        surface micro-texture
 */
export function LiquidGlass<T extends ElementType = 'div'>({
  as,
  intensity = 'medium',
  interactive = false,
  className = '',
  ...rest
}: LGProps<T>) {
  const Tag     = (as ?? 'div') as ElementType
  const ref     = useRef<HTMLElement>(null)

  function onMove(e: MouseEvent<HTMLElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%')
    el.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%')
  }

  function onLeave() {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--mx', '15%')
    el.style.setProperty('--my', '18%')
  }

  const cls = [
    'lg',
    `lg--${intensity}`,
    interactive && 'lg--interactive',
    className,
  ].filter(Boolean).join(' ')

  return (
    <Tag
      ref={ref}
      className={cls}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={!interactive ? { overflow: 'visible' } : undefined}
      {...(rest as any)}
    />
  )
}
