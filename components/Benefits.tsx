import React from 'react'
import Reveal from './Reveal'

/**
 * Benefits
 * ----------------------------------------------------------------------------
 * The section directly below the hero. Pure-white, editorial layout that
 * outlines what the product does for the buyer.
 *
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │ SWAP: everything here is placeholder copy.                           │
 *  │  - EYEBROW / LEAD: the headline pitch                               │
 *  │  - BENEFITS[]: title + body for each point (add / remove freely)   │
 *  └─────────────────────────────────────────────────────────────────────┘
 */

const EYEBROW = 'Benefits'
const LEAD = 'Everything about DREAM is built to be kept, used, and passed on.'

type Benefit = { title: string; body: string }

const BENEFITS: Benefit[] = [
  {
    title: 'Premium materials',
    body: 'SWAP — describe the material / finish and why it feels better in the hand than anything else in the category.',
  },
  {
    title: 'Made to last',
    body: 'SWAP — durability claim. What it survives, how long it holds up, what the wear looks like over time.',
  },
  {
    title: 'Considered details',
    body: 'SWAP — the small design decisions people notice on day two: the edge, the weight, the way it opens.',
  },
  {
    title: 'Responsibly produced',
    body: 'SWAP — sourcing, manufacturing, packaging. Keep it specific and verifiable, not vague.',
  },
  {
    title: 'Ships worldwide',
    body: 'SWAP — fulfilment story: where you ship, how fast, what the unboxing is like.',
  },
  {
    title: 'Backed for life',
    body: 'SWAP — guarantee / warranty / returns. Remove this card if it does not apply.',
  },
]

const Benefits: React.FC = () => {
  return (
    <section id="benefits" className="bg-white py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-6">
        {/* Lead */}
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
            {EYEBROW}
          </p>
          <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-neutral-900 md:text-5xl">
            {LEAD}
          </h2>
        </Reveal>

        {/* Benefit grid */}
        <div className="mt-16 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 md:mt-24">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 3) * 0.08}>
              <div className="border-t border-neutral-200 pt-5">
                <span className="text-sm font-medium tabular-nums text-neutral-300">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-neutral-900">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{b.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Benefits
