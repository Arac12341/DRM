import React, { useEffect, useState } from 'react'

/**
 * SiteHeader
 * ----------------------------------------------------------------------------
 * Fixed, always-transparent header — no background, border or blur, ever.
 *
 * The only thing that changes is the text colour, and only so the nav stays
 * readable: white while the black hero is behind the header, dark once the hero
 * has scrolled up past it and the white page is behind instead. If you want the
 * text to stay white the whole way down, delete `pastHero` and hard-code
 * `text-white` below.
 *
 * SWAP: brand name, nav labels + hrefs.
 */

// SWAP: nav grows as sections are added.
const NAV_LINKS = [{ label: 'The Pack', href: '#pack' }]

// Approx header height (px). Below this, the hero no longer covers the header.
const HEADER_H = 64

const SiteHeader: React.FC = () => {
  const [pastHero, setPastHero] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const update = () => {
      const hero = document.getElementById('hero')
      // While the hero is pinned it stays fixed at the top of the viewport, so
      // its rect bottom is ~viewport height; once it scrolls away the bottom
      // rises past the header and we flip to dark text.
      // If the hero isn't in the DOM yet (it's a client-only dynamic import),
      // assume we're over it — white text on the black stage.
      setPastHero(hero ? hero.getBoundingClientRect().bottom <= HEADER_H : false)
    }
    update()
    // The hero mounts a beat after us (dynamic import); re-check once it's in.
    const settle = window.setTimeout(update, 600)
    // passive: we never call preventDefault — lets the browser scroll smoothly.
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.clearTimeout(settle)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <header
      className={[
        'fixed inset-x-0 top-0 z-50 bg-transparent transition-colors duration-300',
        pastHero ? 'text-neutral-900' : 'text-white',
      ].join(' ')}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="text-lg font-semibold tracking-tight">
          DREAM
        </a>

        {/* Desktop nav */}
        <ul className="hidden gap-8 text-sm md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="opacity-80 transition-opacity hover:opacity-100">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Mobile toggle — bars follow the current text colour. */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden"
        >
          <span className="block h-0.5 w-6 bg-current" />
          <span className="mt-1.5 block h-0.5 w-6 bg-current" />
          <span className="mt-1.5 block h-0.5 w-6 bg-current" />
        </button>
      </nav>

      {/* Mobile menu panel — solid so it's readable wherever it opens. */}
      {menuOpen && (
        <ul className="flex flex-col gap-1 border-t border-neutral-200 bg-white px-6 py-4 text-sm text-neutral-900 md:hidden">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="block py-2 opacity-80 hover:opacity-100"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}

export default SiteHeader
