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

  // Extra whole turn the hero card does the moment the email form is submitted.
  // Tweened 0 -> +1 by the submit handler; HeroScene adds it to the flip target.
  const boostRef = useRef(0)

  // ---- Inline waitlist submit (no page nav) --------------------------------
  const FORM_ENDPOINT = 'https://formspree.io/f/mrpgezjo'
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [formError, setFormError] = useState('')
  const successRef = useRef<HTMLDivElement>(null)
  const confettiRef = useRef<HTMLDivElement>(null)

  // A quick celebratory burst from the form's position.
  const fireConfetti = (cx: number, cy: number) => {
    const layer = confettiRef.current
    if (!layer) return
    const colors = ['#ff3b30', '#ffffff', '#ff6b61', '#c9201a']
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div')
      const w = 6 + Math.random() * 7
      p.style.cssText =
        `position:absolute;left:${cx}px;top:${cy}px;width:${w}px;height:${w * 0.55 + 2}px;` +
        `border-radius:2px;background:${colors[i % colors.length]};will-change:transform,opacity`
      layer.appendChild(p)
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.95
      const dist = 110 + Math.random() * 240
      gsap.to(p, {
        x: Math.cos(ang) * dist,
        y: Math.sin(ang) * dist + 160,
        rotation: (Math.random() - 0.5) * 720,
        duration: 1.1 + Math.random() * 0.7,
        ease: 'power3.out',
      })
      gsap.to(p, {
        opacity: 0,
        duration: 0.5,
        delay: 0.7 + Math.random() * 0.5,
        onComplete: () => p.remove(),
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const rect = form.getBoundingClientRect()
    setFormStatus('submitting')
    setFormError('')
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
      if (res.ok) {
        setFormStatus('success')
        fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2)
        gsap.to(boostRef, { current: boostRef.current + 1, duration: 1.15, ease: 'power2.inOut' })
        return
      }
      const data = (await res.json().catch(() => null)) as
        | { errors?: { message: string }[] }
        | null
      setFormStatus('error')
      setFormError(
        data?.errors?.length
          ? data.errors.map((x) => x.message).join(', ')
          : 'Something went wrong. Please try again.'
      )
    } catch {
      setFormStatus('error')
      setFormError('Network error — check your connection and try again.')
    }
  }

  // Ease the success card in when it appears.
  useEffect(() => {
    if (formStatus === 'success' && successRef.current) {
      gsap.from(successRef.current, { autoAlpha: 0, y: 12, duration: 0.5, ease: 'power2.out' })
    }
  }, [formStatus])

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
          <HeroScene progressRef={progressRef} boostRef={boostRef} />
        </Canvas>
      )}

      {/* ---- Fallback for no-WebGL devices ---- */}
      {webglReady === false && <div className="absolute inset-0 bg-black" />}

      {/* Film-grain overlay (CSS, cheap, works with or without WebGL). */}
      <div className="grain pointer-events-none absolute inset-0 opacity-60" />

      {/* ---- Wordmark + waitlist form, stacked at bottom-left ---- */}
      <div className="pointer-events-auto absolute bottom-0 left-0 flex max-w-full flex-col items-start gap-4 px-[4vw] pb-[3vw]">
        {formStatus === 'success' ? (
          <div
            ref={successRef}
            className="flex w-full max-w-[460px] flex-col gap-1.5 rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-5 backdrop-blur-sm"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              You&rsquo;re on the list
            </p>
            <p className="text-sm text-white/70">
              Check your inbox and confirm your email to lock in your spot.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            action={FORM_ENDPOINT}
            method="POST"
            className="flex w-full max-w-[460px] flex-wrap gap-2"
          >
            <input
              type="email"
              name="email"
              placeholder="you@email.com"
              required
              disabled={formStatus === 'submitting'}
              className="min-w-[220px] flex-1 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-white placeholder-white/60 outline-none focus:border-white/40 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={formStatus === 'submitting'}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-black transition duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {formStatus === 'submitting' ? 'Joining…' : 'Join'}
              <span aria-hidden>→</span>
            </button>
            {formStatus === 'error' && (
              <p className="w-full text-xs text-white/80">{formError}</p>
            )}
          </form>
        )}

        {/* SWAP: brand wordmark. */}
        <span className="block select-none font-serif font-extrabold leading-[0.85] tracking-tighter text-white text-[clamp(4rem,14vw,10rem)] [text-shadow:0_2px_40px_rgba(0,0,0,0.55)]">
          DREAM
        </span>
      </div>

      {/* Confetti burst layer — populated by fireConfetti() on submit. */}
      <div
        ref={confettiRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      />

      {/* Scroll hint, bottom-right */}
      <div className="pointer-events-none absolute bottom-8 right-6 text-xs uppercase tracking-widest text-white/50">
        Scroll
      </div>
    </section>
  )
}

export default Hero3D
