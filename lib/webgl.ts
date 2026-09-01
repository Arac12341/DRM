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
 * Whether to run the reduced-motion code paths (static poses, no pin, no
 * parallax).
 *
 * DISABLED: always returns false so every visitor gets the full scroll
 * animation regardless of their OS "reduce motion" setting. The scroll-driven
 * flips only move on user scroll (no autoplay), so this is a deliberate call.
 * Flip the body back to the `matchMedia` check to honour the OS setting again.
 */
export function prefersReducedMotion(): boolean {
  return false
}
