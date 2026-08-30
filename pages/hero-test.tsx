import dynamic from 'next/dynamic'
import React from 'react'

/**
 * /hero-test — isolated harness for the 3D hero.
 *
 * Renders ONLY <Hero3D> plus a tall spacer so you can exercise the
 * scroll-linked camera travel without the rest of the marketing page.
 * Delete this route (or keep it) once the hero is wired into the real page.
 */
const Hero3D = dynamic(() => import('../components/Hero3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-black text-sm text-white/60">
      Loading 3D hero…
    </div>
  ),
})

const HeroTestPage: React.FC = () => {
  return (
    <>
      <Hero3D sectionId="hero" />

      {/* Spacer: gives ScrollTrigger somewhere to scroll into. */}
      <section className="mx-auto max-w-2xl px-6 py-32 text-center">
        <h2 className="text-2xl font-semibold">Below the hero</h2>
        <p className="mt-3 text-neutral-500">
          Scroll back up — the camera should have pushed in toward the sphere.
          This block only exists so the page is tall enough to scroll.
        </p>
      </section>
      <div className="h-[60vh]" />
    </>
  )
}

export default HeroTestPage
