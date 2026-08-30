/**
 * Tiny WebGL capability probe.
 *
 * We render the 3D hero only when the browser can actually create a WebGL
 * context. Some environments that *look* capable still fail:
 *   - very old browsers / no GPU
 *   - GPU blocklisted by the browser
 *   - headless/CI, some remote-desktop sessions
 *   - user has disabled WebGL
 *
 * Callers use this to decide between <Canvas> and a static fallback hero.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false // SSR: never try
  try {
    const canvas = document.createElement('canvas')
    // `webgl2` first (what three prefers), then fall back to `webgl`/experimental.
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    return Boolean(gl)
  } catch {
    return false
  }
}

/**
 * True when the user has asked the OS to minimise non-essential motion.
 * We respect this by disabling parallax + scroll-scrubbed camera travel.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
