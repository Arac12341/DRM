import { useEffect, useLayoutEffect } from 'react'

/**
 * `useLayoutEffect` warns when it runs during SSR (it can't). On the client we
 * still want layout-effect timing (fires before paint — no flash of content in
 * its pre-animation state). This picks the right one per environment.
 *
 * Standard shim; also what GSAP recommends for React.
 */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default useIsomorphicLayoutEffect
