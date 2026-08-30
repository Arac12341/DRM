import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroScene from './hero/HeroScene'
import { isWebGLAvailable, prefersReducedMotion } from '../lib/webgl'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Hero3D
 * ----------------------------------------------------------------------------
 * Full-viewport WebGL hero. This file owns everything that touches the DOM:
 *   - the <Canvas> element + renderer config
 *   - the GSAP ScrollTrigger that PINS the hero and reports scroll progress
 *   - the wordmark overlay
 *   - the non-WebGL fallback
 *   - an IntersectionObserver that stops rendering once the hero is off-screen
 *
 * Scene motion (the scroll-driven flip + mouse parallax) lives in
 * ./hero/HeroScene and consumes the pin progress via `progressRef`.
 *
 * IMPORTANT: import this with `next/dynamic({ ssr: false })`. react-three-fiber
 * touches the DOM/WebGL and must not run on the server.
 */

type Hero3DProps = {
  /** id / ScrollTrigger pin target. */
  sectionId?: string
  /**
   * How much scroll distance the hero stays pinned for, as a fraction of the
   * viewport height. 1.25 => the hero holds for 1.25 screens while the flip
   * plays out, then the page continues.
   */
  pinScreens?: number
}

const Hero3D: React.FC<Hero3DProps> = ({ sectionId = 'hero', pinScreens = 1.25 }) => {
  const sectionRef = useRef<HTMLElement>(null)

  // Live 0..1 progress through the pinned hero. Written by ScrollTrigger below,
  // read every frame by HeroScene. A ref (not state) so updating it never
  // re-renders React.
  const progressRef = useRef(0)

  // WebGL support — decided after mount (needs `window`).
  const [webglReady, setWebglReady] = useState<boolean | null>(null)
  useEffect(() => {
    setWebglReady(isWebGLAvailable())
  }, [])

  // Render loop control: 'always' while the hero is visible, 'never' once it has
  // scrolled fully out of view (saves GPU/battery on the rest of the page).
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always')
  useEffect(() => {
    const el = sectionRef.current
    if (!el || webglReady !== true) return
    const io = new IntersectionObserver(
      ([entry]) => setFrameloop(entry.isIntersecting ? 'always' : 'never'),
      { rootMargin: '0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [webglReady])

  // ---- PIN + SCROLL PROGRESS -------------------------------------------------
  // One ScrollTrigger:
  //   pin: true  -> the hero element stays fixed while `end - start` scrolls by
  //   onUpdate   -> self.progress (0..1) is stashed for the scene to read
  // No `scrub` needed — we're not tweening a GSAP target here; HeroScene damps
  // toward the progress value itself in its frame loop.
  useLayoutEffect(() => {
    if (webglReady !== true) return
    if (prefersReducedMotion()) return // no pin, no flip

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: () => `+=${window.innerHeight * pinScreens}`,
        pin: true,
        pinType: 'fixed',
        pinSpacing: true,
        anticipatePin: 1,
        // This section is above the pack section, so it must refresh FIRST — its
        // pin spacer determines where the pack section (and its trigger) sit.
        refreshPriority: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progressRef.current = self.progress
        },
      })
    })

    // This hero is a client-only dynamic import, so it mounts AFTER the
    // statically-imported pack section has already created its ScrollTrigger.
    // Adding this pin shifts the pack section down by the pin spacer, so every
    // trigger's start/end must be recomputed once this one exists.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh())
    // Fonts/images below can shift layout too.
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('load', onLoad)
      ctx.revert() // kills the trigger + removes the pin spacer
    }
  }, [webglReady, pinScreens])

  return (
    <section
      id={sectionId}
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-black text-white"
    >
      {/* ---- 3D layer ---- */}
      {webglReady === true && (
        <Canvas
          className="absolute inset-0"
          // Cap DPR: retina screens otherwise render ~4x the pixels for little
          // visible gain. [1, 1.75] is a good perf/quality trade-off.
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 6], fov: 50, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          frameloop={frameloop}
        >
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={0.6} />
          <HeroScene progressRef={progressRef} />
        </Canvas>
      )}

      {/* ---- Fallback for no-WebGL devices ---- */}
      {webglReady === false && <div className="absolute inset-0 bg-black" />}

      {/* Film-grain overlay (CSS, cheap, works with or without WebGL). */}
      <div className="grain pointer-events-none absolute inset-0 opacity-60" />

      {/* ---- Wordmark + waitlist form, stacked at bottom-left ---- */}
      <div className="pointer-events-auto absolute bottom-0 left-0 flex max-w-full flex-col items-start gap-4 px-[4vw] pb-[3vw]">
        {/* SWAP: point `action` at your Formspree form endpoint. */}
        <form
          action="https://formspree.io/f/mrpgezjo"
          method="POST"
          className="flex w-full max-w-[460px] flex-wrap gap-2"
        >
          <input
            type="email"
            name="email"
            placeholder="you@email.com"
            required
            className="min-w-[220px] flex-1 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-white placeholder-white/60 outline-none focus:border-white/40"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-black transition duration-300 hover:-translate-y-0.5"
          >
            Join
            <span aria-hidden>→</span>
          </button>
        </form>

        {/* SWAP: brand wordmark. */}
        <span className="block select-none font-serif font-extrabold leading-[0.85] tracking-tighter text-white text-[clamp(4rem,14vw,10rem)] [text-shadow:0_2px_40px_rgba(0,0,0,0.55)]">
          DREAM
        </span>
      </div>

      {/* Scroll hint, bottom-right */}
      <div className="pointer-events-none absolute bottom-8 right-6 text-xs uppercase tracking-widest text-white/50">
        Scroll
      </div>
    </section>
  )
}

export default Hero3D
