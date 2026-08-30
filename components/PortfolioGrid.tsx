import React from 'react'
import Reveal from './Reveal'

/**
 * PortfolioGrid
 * ----------------------------------------------------------------------------
 * Responsive 1 / 2 / 3-column grid of project cards. Each card has a hover
 * state (image scales, overlay fades in) done with pure CSS transitions —
 * cheap and 60fps.
 *
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │ SWAP:                                                                │
 *  │  - PROJECTS array below: title / category / href / image            │
 *  │  - The image is currently a CSS gradient. To use a real image:      │
 *  │      1. put files in /public/work/alpha.jpg …                       │
 *  │      2. replace the <div style={{background:…}}/> with:             │
 *  │           <Image src={p.image} alt={p.title} fill                  │
 *  │             className="object-cover transition-transform            │
 *  │             duration-500 group-hover:scale-105" />                  │
 *  │         (import Image from 'next/image')                           │
 *  └─────────────────────────────────────────────────────────────────────┘
 */

type Project = {
  title: string
  category: string
  href: string
  /** SWAP: replace `gradient` with a real `image: '/work/alpha.jpg'`. */
  gradient: string
}

const PROJECTS: Project[] = [
  { title: 'Aurora Retail', category: 'Brand + Web', href: '#', gradient: 'linear-gradient(135deg,#ff5c7c,#ff3b30)' },
  { title: 'Northwind Labs', category: 'Product', href: '#', gradient: 'linear-gradient(135deg,#5c9dff,#2dd4bf)' },
  { title: 'Kestrel Studio', category: 'Identity', href: '#', gradient: 'linear-gradient(135deg,#ffd15c,#f97316)' },
  { title: 'Meridian Bank', category: 'Design System', href: '#', gradient: 'linear-gradient(135deg,#ff3b30,#5c9dff)' },
  { title: 'Fathom Audio', category: 'Web + Motion', href: '#', gradient: 'linear-gradient(135deg,#2dd4bf,#5c9dff)' },
  { title: 'Cobalt Health', category: 'Product', href: '#', gradient: 'linear-gradient(135deg,#f97316,#ff5c7c)' },
]

const PortfolioGrid: React.FC = () => {
  return (
    <section id="work" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal>
        <h2 className="text-3xl font-semibold tracking-tight">Selected Work</h2>
        <p className="mt-2 max-w-md text-sm text-neutral-500">
          SWAP: short section intro / brand copy goes here.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((p, i) => (
          // Stagger the reveal a little by index.
          <Reveal key={p.title} delay={(i % 3) * 0.08}>
            <a
              href={p.href}
              className="group block overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow duration-300 hover:shadow-xl hover:shadow-neutral-200/60"
            >
              {/* Image / media */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <div
                  className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105"
                  style={{ background: p.gradient }}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="text-sm font-medium text-white">View project →</span>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-baseline justify-between p-4">
                <h3 className="text-base font-medium text-neutral-900">{p.title}</h3>
                <span className="text-xs uppercase tracking-wider text-neutral-400">{p.category}</span>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export default PortfolioGrid
