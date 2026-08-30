# Interactive 3D Hero

Next.js (pages router) + TypeScript + Tailwind + `@react-three/fiber` / `drei` + GSAP.

Two scroll-pinned sections:

1. **Hero** — WebGL (`@react-three/fiber`). Pure-black stage, a single playing
   card (placeholder Jack of Hearts, drawn to canvas). Scroll progress drives a
   360° flip about the vertical axis (face → back → face); cursor adds parallax.
2. **Pack** — WebGL. Pure-white stage, a 3D model of the real DREAM Oral Strips
   box (front + back artwork cropped from the supplied dieline, canvas-drawn
   spine). Scroll progress does two things at once: a full 360° turn about the
   vertical axis (front → back → front) while the box translates in from
   off-screen left to its resting spot.

Two gotchas both pins hit, handled in the code:
- Each pinned section is wrapped in a plain `<div>` in `pages/index.tsx` so
  GSAP's pin-spacer DOM surgery stays isolated from React reconciliation
  (without it, two pins crash with `insertBefore`).
- The hero is a client-only dynamic import that adds its pin *after* the pack
  section mounts, so the pack's start/end were computed against stale layout.
  Fixed with `refreshPriority` (hero +1, pack −1) + a deferred `ScrollTrigger.refresh()`.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (also full type-check)
```

- **`/`** — the full page.
- **`/hero-test`** — the hero scene in isolation with a scroll spacer.
- **`/pack-test`** — the pack scene in isolation with scroll spacers.

## Project map

```
lib/
  webgl.ts                      isWebGLAvailable(), prefersReducedMotion()
  useIsomorphicLayoutEffect.ts  SSR-safe layout effect (GSAP-recommended shim)
components/
  Layout.tsx        site chrome; header overlays content (no top padding on <main>)
  SiteHeader.tsx    fixed, always-transparent header; text colour flips for contrast; mobile menu
  Hero3D.tsx        <Canvas> + renderer config + wordmark overlay + WebGL fallback
                    + IntersectionObserver that pauses the render loop off-screen
  Reveal.tsx        fade/slide-in-on-scroll wrapper (GSAP ScrollTrigger)
  Hero3D.tsx        hero <Canvas> + pin ScrollTrigger + wordmark/CTA overlay + fallback
  PackReveal.tsx    pack <Canvas> + pin ScrollTrigger + no-WebGL fallback (flat img)
  Benefits.tsx      UNUSED — earlier benefits section, kept on disk; safe to delete
  PortfolioGrid.tsx UNUSED — earlier portfolio grid, kept on disk; safe to delete
  hero/
    HeroScene.tsx     inside hero <Canvas>: scroll-progress → Y-flip + mouse parallax
    PlayingCard.tsx     thin box, 6 materials; front/back drawn to <canvas>
    ParticleSphere.tsx  Points + noise/grain GLSL shader — PARKED (not mounted)
    FloatingPlanes.tsx  transparent cutout planes — PARKED (not mounted)
  pack/
    PackScene.tsx     inside pack <Canvas>: 3D box model; scroll → 360° Y-flip + translate-in
    packTextures.ts   canvas-drawn spine + shadow textures (front/back use real art)
pages/
  _app.tsx, index.tsx, hero-test.tsx, pack-test.tsx
```

---

## ⇄ Where to swap in YOUR content

Search the codebase for `SWAP:` — every spot is tagged. Summary:

### 1. The card art (front + back) — `components/hero/PlayingCard.tsx`
Currently a Jack of Hearts + a blue lattice back, both drawn to `<canvas>` at
load — no external files. To use real art:
1. Drop `public/card-front.png` and `public/card-back.png` (portrait, ~2.5 : 3.5,
   e.g. 750×1050, compressed).
2. `import { useTexture } from '@react-three/drei'`, then
   `const [front, back] = useTexture(['/card-front.png', '/card-back.png'])` and
   delete `makeFrontTexture` / `makeBackTexture`.
3. Keep `front.colorSpace = THREE.SRGBColorSpace` (same for `back`).
4. Card size / thickness: `CARD_H`, `CARD_W`, `CARD_D` constants at the top.
There is a boxed `SWAP:` block in the file with the same steps.

### 2. Parked 3D subjects
`ParticleSphere.tsx` (grainy sphere) and `FloatingPlanes.tsx` (cutout planes)
are still in the tree but not mounted. Re-enable either by importing it back into
`HeroScene.tsx`. The sphere makes a nice faint backdrop *behind* the card —
render it before `<PlayingCard />` inside the group and drop its `count` / size.

### 3. Hero overlay — `components/Hero3D.tsx`
The “DZ.” wordmark, the Pre-order CTA (`href` → your real waitlist URL), the
“Scroll” hint.

### 4. Brand name + nav — `components/SiteHeader.tsx`
`NAV_LINKS` array and the “DREAM” wordmark.

### 5. Pack box — `components/pack/`
- Front / back art: `public/dream-box-front.jpg` and `dream-box-back.jpg`,
  cropped from the supplied dieline `components/DREAM-editable-layout.svg`. Swap
  the files (keep the ~750×1048 aspect) or the paths in `PackScene.tsx`.
- `packTextures.ts` — the canvas-drawn red spine + the soft ground shadow.
- `PackScene.tsx` — box dimensions (`BOX_W/H/D`), `TURNS` (revolutions across the
  scroll), `REST_X` / `REST_Y` (where it lands; `REST_X > 0` = right of centre),
  `VIEW_TILT_X`.
- Lighting is in `PackReveal.tsx`.

### 6. Footer copy — `pages/index.tsx`

### 7. Page `<title>` + meta description — `pages/index.tsx` (`<Head>`)

### 8. Brand colours (non-3D) — `tailwind.config.js`
`theme.extend.colors.bg` is the dark background. Add the rest of your palette here
and replace the hard-coded `#hex` / `white/10` utility values in the components.

### 9. Motion tuning
- Pin lengths: `pinScreens` props on `<Hero3D>` / `<PackReveal>` in
  `pages/index.tsx` (1.25 and 1.8 screens) — how much scroll each animation gets.
- Hero flip amount: `FLIP_TURNS` in `HeroScene.tsx`.
- Hero parallax: the `* 0.12` / `* 0.4` factors in `HeroScene.tsx`.
- Pack flip + landing: `TURNS`, `REST_X` / `REST_Y` at the top of `PackScene.tsx`.
- Reveal distance/timing: `y` and `delay` props on `<Reveal>`.

---

## Performance notes

- **The card is cheap** — one box, two 512×716 canvas textures, `MeshBasicMaterial`
  (unlit), built once. The current hero is not GPU-bound. If you re-mount the
  parked `ParticleSphere`, its `count` (5000, → ~2500 on weak GPUs) becomes the
  main dial again.
- **DPR is capped at 1.75** (`dpr={[1, 1.75]}` in `Hero3D.tsx`). Retina screens
  otherwise render ~4× the pixels for little visible gain. Lower to `[1, 1.5]` if needed.
- **No per-frame allocations.** Geometry, textures and materials are built once in
  `useMemo`; the frame loop only mutates transforms. Keep it that way — don't
  create `new THREE.*` objects inside `useFrame`.
- **Render loop pauses** when the hero scrolls out of view (`IntersectionObserver`
  toggles `frameloop` to `'never'`), so the rest of the page costs no GPU.
- **Real card art:** compress hard (`.webp` or optimized `.png`), keep it ≤ ~1024px
  on the long edge. `texture.anisotropy` is already maxed so the face stays sharp
  when the card is near edge-on mid-flip.
- **GSAP ScrollTrigger:** the hero pin and every `<Reveal>` trigger are created
  inside `gsap.context()` and reverted on unmount — no leaks on route changes /
  Fast Refresh. `ScrollTrigger.refresh()` runs on `window load` so late images
  don't desync the pin.
- The three.js bundle (~0.5 MB gzipped) loads in a **separate chunk after first
  paint** via `next/dynamic({ ssr: false })`; it is not in the initial JS.

## Browser / compatibility caveats

- **WebGL fallback:** `Hero3D.tsx` probes for a WebGL context on mount. If it's
  missing (old device, blocklisted GPU, WebGL disabled, some headless/remote
  environments) it renders a **plain black panel** instead of the `<Canvas>` —
  the wordmark and the rest of the page work normally. Style that fallback to taste.
- **`prefers-reduced-motion`:** when set, the hero pin, the scroll flip and mouse
  parallax are all skipped (the subject sits at rest, section scrolls normally),
  and `<Reveal>` renders content with no animation. The sphere shader keeps its
  slow churn.
- **iOS Safari:** works, but WebGL contexts are memory-limited — keep particle
  count and texture sizes modest. Test on a real device. ScrollTrigger pinning
  can also feel slightly off where the URL bar resizes the viewport mid-scroll;
  if it bothers you, gate the pin to `min-width: 768px`.
- **three.js is pinned to 0.156** to match `@react-three/*`. Don't bump three
  alone — upgrade the trio together.
- **Next 13.5.2** has a published security advisory; bumping to the latest 13.x
  patch (or 14.x) is recommended before deploying.
