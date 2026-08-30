import React, { useEffect, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import PlayingCard from './PlayingCard'
// import ParticleSphere from './ParticleSphere' // parked — the grainy sphere,
//   kept in case you want it as a faint backdrop behind the card.
// import FloatingPlanes from './FloatingPlanes' // parked — re-enable when the
//   product-packaging cutouts are ready (see components/hero/FloatingPlanes.tsx)
import { prefersReducedMotion } from '../../lib/webgl'

/**
 * HeroScene
 * ----------------------------------------------------------------------------
 * Everything that lives *inside* the <Canvas>. Pure scene logic — no <Canvas>
 * config and no DOM. Two motion layers, each in its own commented block:
 *
 *   1. Scroll flip ........ the group's Y rotation is tied to scroll progress
 *                           through the pinned hero: progress 0 -> 1 maps to a
 *                           full 360° turn about the vertical axis, so the card
 *                           reads face (0) → back (0.5) → face (1).
 *   2. Mouse parallax ..... small damped camera + group tilt toward the cursor,
 *                           layered on top of the scroll flip.
 *
 * The DOM-side ScrollTrigger (in Hero3D) pins the section and writes its 0..1
 * progress into `progressRef`; here we only consume it.
 *
 * The camera stays at a fixed distance, so the card never changes size.
 * `prefers-reduced-motion` disables both layers (Hero3D also skips the pin), so
 * the card just sits face-on at rest.
 */

// TUNE: how many full turns the flip makes across the pin.
// 1 => front → back → front. 0.5 => front → back (and stays).
const FLIP_TURNS = 1

type HeroSceneProps = {
  /** Live 0..1 scroll progress through the pinned hero, written by Hero3D. */
  progressRef: MutableRefObject<number>
}

const HeroScene: React.FC<HeroSceneProps> = ({ progressRef }) => {
  const groupRef = useRef<THREE.Group>(null)
  const { camera, size } = useThree()

  const reduceMotion = useRef(false)

  // Push the card to the right so it's centred in the space the bottom-left
  // "DZ." wordmark / CTA stack leaves free. World units at z=0; scaled down on
  // smaller screens where that stack is small and the card is near full-bleed.
  // (Camera still looks at the origin, so this reads as a pure horizontal shift.)
  const cardOffsetX = size.width >= 1024 ? 1.3 : size.width >= 768 ? 0.7 : 0

  // ---------------------------------------------------------------------------
  // 2. MOUSE PARALLAX (input only — applied in the frame loop below)
  // ---------------------------------------------------------------------------
  // Keep a normalised pointer target (-1..1 per axis) updated from a window
  // listener; ease toward it in useFrame. Easing in the frame loop (instead of
  // a tween per mousemove) is smooth, frame-rate-independent, and never stacks
  // up pending tweens.
  const pointerTarget = useRef({ x: 0, y: 0 })

  useEffect(() => {
    reduceMotion.current = prefersReducedMotion()
    if (reduceMotion.current) return

    const onPointerMove = (e: PointerEvent) => {
      // 0..1 across the viewport -> -1..1, y flipped so "up" is positive.
      pointerTarget.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerTarget.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onPointerMove)
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [])

  // ---------------------------------------------------------------------------
  // FRAME LOOP — the only place we touch the camera / group each frame.
  // ---------------------------------------------------------------------------
  useFrame((_state, delta) => {
    const group = groupRef.current
    if (!group || reduceMotion.current) return

    // THREE.MathUtils.damp — frame-rate-independent exponential ease:
    //   damp(current, target, lambda, dt)  — higher lambda = snappier.
    const damp = THREE.MathUtils.damp

    // 1. Scroll flip: progress (0..1) -> Y rotation (0..2π·FLIP_TURNS).
    //    We damp toward it rather than assigning directly so fast scroll
    //    flicks read as smooth motion instead of jumps.
    const flipY = progressRef.current * Math.PI * 2 * FLIP_TURNS

    // 2. Parallax: a small nudge layered onto the flip target + a group tilt.
    const parallaxY = pointerTarget.current.x * 0.12
    const parallaxX = -pointerTarget.current.y * 0.1

    group.rotation.y = damp(group.rotation.y, flipY + parallaxY, 4, delta)
    group.rotation.x = damp(group.rotation.x, parallaxX, 3, delta)

    camera.position.x = damp(camera.position.x, pointerTarget.current.x * 0.4, 2.5, delta)
    camera.position.y = damp(camera.position.y, pointerTarget.current.y * 0.3, 2.5, delta)
    camera.lookAt(0, 0, 0)
  })

  return (
    // position-x offsets the whole (spinning) group, so the card still flips in
    // place — it's just parked to the right.
    <group ref={groupRef} position-x={cardOffsetX}>
      {/* The card flips with the group: front at scroll 0, back at 0.5, front at 1. */}
      <PlayingCard />
      {/* <ParticleSphere /> — parked (possible backdrop). */}
      {/* <FloatingPlanes /> — parked until the cutout images exist. */}
    </group>
  )
}

export default HeroScene
