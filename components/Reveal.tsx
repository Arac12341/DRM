import React, { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../lib/webgl'
import useIsomorphicLayoutEffect from '../lib/useIsomorphicLayoutEffect'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * <Reveal> — fades + slides its children up as they enter the viewport.
 *
 * Uses GSAP ScrollTrigger (not CSS/IntersectionObserver) so the reveal shares
 * one animation engine with the hero and stays in sync on refresh. Honours
 * `prefers-reduced-motion` by rendering fully visible with no animation.
 *
 * Renders a plain <div> wrapper:
 *   <Reveal><MyCard /></Reveal>
 *   <Reveal delay={0.1} y={40} className="…">…</Reveal>
 */

type RevealProps = {
  children: React.ReactNode
  /** seconds to wait before animating in */
  delay?: number
  /** px to travel upward into place */
  y?: number
  className?: string
}

const Reveal: React.FC<RevealProps> = ({ children, delay = 0, y = 30, className }) => {
  const ref = useRef<HTMLDivElement>(null)

  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: 1, y: 0 })
      return
    }

    // Hide before first paint (useLayoutEffect runs pre-paint) so there's no
    // flash, but without a permanent inline `visibility:hidden` that would
    // strand the content if JS ever fails to run.
    gsap.set(el, { autoAlpha: 0, y })

    const ctx = gsap.context(() => {
      gsap.to(el, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        delay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          // play on enter, reverse when scrolled back above. Switch to
          // 'play none none none' for a one-shot reveal.
          toggleActions: 'play none none reverse',
        },
      })
    }, el)

    return () => ctx.revert()
  }, [delay, y])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

export default Reveal
