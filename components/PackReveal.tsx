import React, { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PackScene from './pack/PackScene'
import useIsomorphicLayoutEffect from '../lib/useIsomorphicLayoutEffect'
import { isWebGLAvailable } from '../lib/webgl'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * PackReveal — pages 2 + 3, one persistent 3D deck.
 * ----------------------------------------------------------------------------
 * A tall section with ONE `position: sticky` layer that holds the <Canvas> AND
 * the two copy blocks in the viewport for the whole region. A single scrubbed
 * ScrollTrigger (no pin) reports 0..1 progress; the deck reads it in useFrame,
 * the copy blocks are driven by a paused GSAP timeline scrubbed to the same
 * progress. Nothing is `position:fixed`, so there's no pin-release glitch.
 *
 * Scroll feel:
 *   0.00–0.28  the deck flies in and does its 360° flip in place — the page
 *              itself doesn't move ("locked", like the hero).
 *   0.28–0.74  page-2 copy slides in on the right; then, as the deck slides
 *              right and turns to its back, page-2 copy leaves and page-3 copy
 *              arrives on the left ("scrolling").
 *   0.74–1.00  deck (back) + page-3 copy sit aligned and still ("locked").
 *
 * Import with `next/dynamic({ ssr: false })`.
 */

// Use runtime build-time base path so the background image resolves under
// project pages (e.g. /DRM/dream-box-front.jpg).
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')
const BOX_FRONT = `${BASE}/dream-box-front.jpg` // SWAP: real front-panel art
// Section height (Tailwind classes on the <section>): desktop 560vh, mobile
// 360vh. 100vh of that is the sticky view; the rest is the scroll runway.

// Softer than pure black — easier to read on the white stage.
const INK = 'text-[#1c2340]'
const MUTED = 'text-neutral-500'
const EYEBROW = 'font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400'

// SWAP: the three actives (these are what's on the real box back panel).
const iconClass = 'h-14 w-14 shrink-0 md:h-28 md:w-28 text-[#8b7fd4]'
const INGREDIENTS: { name: string; dose: string; icon: React.ReactNode }[] = [
  {
    name: 'Melatonin',
    dose: '2 mg',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden>
        <path d="M13 2a10 10 0 1 0 9 13A8 8 0 0 1 13 2Z" />
      </svg>
    ),
  },
  {
    name: 'L-Theanine',
    dose: '50 mg',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden>
        <path d="M12 2C7 7 7 13 12 22 17 13 17 7 12 2Z" />
      </svg>
    ),
  },
  {
    name: 'GABA',
    dose: '100 mg',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden>
        <path d="M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12Z" />
      </svg>
    ),
  },
]

type PackRevealProps = { sectionId?: string }

const PackReveal: React.FC<PackRevealProps> = ({ sectionId = 'pack' }) => {
  const sectionRef = useRef<HTMLElement>(null)
  const progressRef = useRef(0)
  const p2Ref = useRef<HTMLDivElement>(null)
  const p3Ref = useRef<HTMLDivElement>(null)

  const [webglReady, setWebglReady] = useState<boolean | null>(null)
  useEffect(() => {
    setWebglReady(isWebGLAvailable())
  }, [])

  useIsomorphicLayoutEffect(() => {
    if (webglReady !== true) return
    const p2 = p2Ref.current
    const p3 = p3Ref.current
    if (!p2 || !p3) return

    const ctx = gsap.context(() => {
      // Copy blocks start below the fold, hidden.
      gsap.set([p2, p3], { yPercent: 110, autoAlpha: 0 })

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
          onUpdate: (self) => {
            progressRef.current = self.progress
          },
          onRefresh: (self) => {
            progressRef.current = self.progress
          },
        },
      })

      // page-2 copy rises into place (right side) — 0.28 → 0.40
      tl.to(p2, { yPercent: 0, autoAlpha: 1, ease: 'power2.out', duration: 0.12 }, 0.28)
      // …holds, then clears out (up) BEFORE the deck slides across — 0.44 → 0.52
      tl.to(p2, { yPercent: -90, autoAlpha: 0, ease: 'power2.in', duration: 0.08 }, 0.44)
      // page-3 copy rises into place on the left, after the deck has passed
      // centre — 0.64 → 0.80
      tl.to(p3, { yPercent: 0, autoAlpha: 1, ease: 'power2.out', duration: 0.16 }, 0.64)
      // Pad the timeline to a total duration of exactly 1 so that
      // `tl.progress(p)` lines up 1:1 with the scroll progress the deck reads.
      tl.to({}, { duration: 0.2 }, 0.8)
    }, sectionRef)

    // Hero above pins after we mount -> recompute positions.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh())
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('load', onLoad)
      ctx.revert()
    }
  }, [webglReady])

  return (
    <section
      id={sectionId}
      ref={sectionRef}
      className="relative h-[560vh] w-full bg-white max-md:h-[360vh]"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* --- 3D deck --- */}
        {webglReady === true && (
          <Canvas
            className="pointer-events-none absolute inset-0"
            dpr={[1, 1.75]}
            camera={{ position: [0, 0, 8.5], fov: 38, near: 0.1, far: 100 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          >
            <hemisphereLight args={['#ffffff', '#e6e6e6', 0.55]} />
            <ambientLight intensity={0.35} />
            <directionalLight position={[5, 7, 6]} intensity={1.45} />
            <directionalLight position={[-5, 2, -3]} intensity={0.35} />
            <Suspense fallback={null}>
              <PackScene progressRef={progressRef} />
            </Suspense>
          </Canvas>
        )}
        {webglReady === false && (
          <div
            className="absolute left-[4%] top-1/2 h-[62%] max-h-[560px] -translate-y-1/2 rounded-md bg-contain bg-left bg-no-repeat shadow-xl"
            style={{ aspectRatio: '750 / 1048', backgroundImage: `url(${BOX_FRONT})` }}
          />
        )}

        {/* --- Page 2 copy: right side (deck left) on desktop; a full-width
            block anchored to the TOP on phones (deck sits low there). --- */}
        <div
          ref={p2Ref}
          className="absolute inset-y-0 right-0 flex items-center will-change-transform max-md:inset-y-auto max-md:inset-x-0 max-md:top-0 max-md:items-start max-md:justify-center max-md:px-6 max-md:pt-16"
        >
          <div className="mr-10 flex w-full max-w-lg items-start gap-6 md:mr-[9vw] max-md:mr-0 max-md:max-w-sm">
            {/* vertical accent bar for visual structure (hidden on small screens) */}
            <div className="hidden h-40 w-1.5 rounded-full bg-black md:block" />

            <div>
              <p className={EYEBROW}>The pack</p>

              {/* Gradient serif headline */}
              <h2 className="mt-6 font-serif text-4xl font-semibold leading-[1.05] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#6b56b8] to-[#8b7fd4] md:text-6xl max-md:mt-4 max-md:text-[1.7rem] max-md:leading-[1.12]">
                A nightcap you can carry in your pocket.
              </h2>

              {/* Translucent backdrop retained; paragraph removed per request */}
              <div className="mt-6 max-w-md rounded-lg bg-white/6 p-6 backdrop-blur-sm max-md:hidden" />
            </div>
          </div>
        </div>

        {/* --- Page 3 copy: left side (deck right) on desktop; a full-width
            block anchored to the BOTTOM on phones (deck sits high there). --- */}
        <div
          ref={p3Ref}
          className="absolute inset-y-0 left-0 flex items-center will-change-transform max-md:inset-y-auto max-md:inset-x-0 max-md:bottom-0 max-md:items-end max-md:justify-center max-md:px-6 max-md:pb-12"
        >
          <div className="ml-6 w-full max-w-lg md:ml-[9vw] max-md:ml-0 max-md:max-w-sm">
            {/* SWAP: page-3 copy — the ingredients story. */}
            <p className={EYEBROW}>Inside every strip</p>
            <h2
              className={`mt-6 text-[1.9rem] font-serif font-semibold leading-[1.15] tracking-tight md:text-[2.6rem] text-[#6b56b8] max-md:mt-4 max-md:text-[1.7rem]`}
            >
              Three ingredients. Nothing to sleep on.
            </h2>

            <div className="mt-12 grid grid-cols-3 divide-x-2 divide-black/70 max-md:mt-6 max-md:grid-cols-1 max-md:divide-x-0 max-md:divide-y max-md:divide-black/15">
              {INGREDIENTS.map((ing) => (
                <div
                  key={ing.name}
                  className="flex flex-col items-center px-3 text-center first:pl-0 last:pr-0 max-md:flex-row max-md:items-center max-md:gap-4 max-md:px-0 max-md:py-4 max-md:text-left"
                >
                  {ing.icon}
                  <div>
                    <h3 className="mt-5 font-serif text-2xl font-semibold leading-tight text-[#8b7fd4] md:text-3xl max-md:mt-0 max-md:text-xl">
                      {ing.name}
                    </h3>
                    <p className="mt-1.5 text-base font-sans text-neutral-500 md:text-lg max-md:mt-0.5 max-md:text-sm">
                      {ing.dose}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PackReveal
