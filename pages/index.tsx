import dynamic from 'next/dynamic'
import Head from 'next/head'
import React from 'react'

// Both sections are client-only (react-three-fiber touches WebGL/DOM). Plain
// coloured boxes stand in during SSR / initial load so layout doesn't jump.
const Hero3D = dynamic(() => import('../components/Hero3D'), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-black" />,
})
const PackReveal = dynamic(() => import('../components/PackReveal'), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-white" />,
})

const Home: React.FC = () => {
  return (
    <>
      <Head>
        {/* SWAP: page title + meta description. */}
        <title>DREAM</title>
        <meta name="description" content="DREAM — placeholder product landing page." />
      </Head>

      {/* Each pinned section gets a plain wrapper <div> that React owns and
          never reorders. GSAP ScrollTrigger's pin-spacer surgery then happens
          INSIDE that div, so it can't clash with React inserting/removing the
          sibling sections (which was crashing with `insertBefore`). */}

      {/* ---- Pinned WebGL hero (scroll drives the card flip) ---- */}
      <div>
        <Hero3D sectionId="hero" pinScreens={1.25} />
      </div>

      {/* ---- WebGL deck: page 2 (fly in + 360° flip, hold) → page 3 (turn to
              back + slide right). Sticky, not pinned. ---- */}
      <div>
        <PackReveal sectionId="pack" />
      </div>

      <footer className="border-t border-neutral-200 py-8">
        <div className="mx-auto max-w-6xl px-6 text-xs text-neutral-400">
          © {new Date().getFullYear()} DREAM. Placeholder footer.
        </div>
      </footer>
    </>
  )
}

export default Home
