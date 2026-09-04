import React from 'react'
import SiteHeader from './SiteHeader'

/**
 * Layout: site chrome shared by every page.
 * The header is `fixed` and overlays content, so <main> has NO top padding —
 * the hero is meant to sit flush under the transparent header.
 */
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center">
          <div className="text-lg font-serif font-semibold">DREAM</div>
          <a
            href="/blog/"
            className="ml-auto text-[11px] font-sans font-semibold uppercase tracking-[0.18em]"
          >
            Journal
          </a>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}

export default Layout
