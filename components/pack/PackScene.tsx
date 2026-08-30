import React, { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  makeBackdropCardBack,
  makeBackdropCardFront,
  makeShadowTexture,
  makeSpineTexture,
} from './packTextures'
import { prefersReducedMotion } from '../../lib/webgl'

/**
 * PackScene — a 3D model of the DREAM Oral Strips box.
 * ----------------------------------------------------------------------------
 * Scroll progress (0..1, from the pinned section) drives two things at once:
 *
 *   1. A full 360° turn about the vertical axis — front → back → front — the
 *      same flip the hero card does.
 *   2. A translate: the box starts off-screen to the left and slides right into
 *      its resting spot as the turn plays out.
 *
 * Both are eased toward with THREE.MathUtils.damp so scroll flicks stay smooth.
 * `prefers-reduced-motion` snaps to the finished pose (front-facing, resting).
 */

// Box dimensions (world units; 2.5" × 3.5" × ~0.8").
const BOX_W = 2.1
const BOX_H = 2.94
const BOX_D = 0.68

// World X positions. ~1 unit ≈ 150px on a 1280-wide canvas.
const REST_X = -1.95 // page-2 resting spot (~300px left of centre)
const END_X = 2.0 // page-3 resting spot (right side)
const REST_Y = -0.15
const VIEW_TILT_X = 0.06 // slight lean so a sliver of the top shows

// ---- Faint slanted playing-card backdrop ------------------------------
const BD_H = 5.6
const BD_W = BD_H * (2.5 / 3.5)
const BD_POS: [number, number, number] = [0.7, 0.25, -3.4] // behind the deck
const BD_SLANT: [number, number, number] = [0.06, 0, -0.2] // constant tilt
const BD_OPACITY = 0.12 // watermark-faint; must not fight the packaging
// Starts on its back (rotation.y = π); turns to its front over this slice of
// scroll (the "second part" — the page-2 → page-3 transition).
const BD_FLIP_FROM = 0.42
const BD_FLIP_TO = 0.9

// The scroll (progress 0..1) is split into phases — must line up with the text
// timeline in PackReveal:
//   0        → P_ENTER : deck flies in + one 360° turn (front→back→front),
//                        lands at REST_X. Nothing else moves ("locked").
//   P_ENTER  → P_HOLD  : deck holds at REST_X (page-2 copy on screen).
//   P_HOLD   → P_MOVE  : deck slides REST_X → END_X, turns another 180° to its
//                        back. Page-2 copy leaves, page-3 copy arrives.
//   P_MOVE   → 1       : deck holds on the right, back showing ("locked" — the
//                        page-3 copy + deck are aligned).
const P_ENTER = 0.28
const P_HOLD = 0.46
const P_MOVE = 0.78

function easeOut(t: number) {
  const c = THREE.MathUtils.clamp(t, 0, 1)
  return 1 - (1 - c) * (1 - c)
}
function easeInOut(t: number) {
  const c = THREE.MathUtils.clamp(t, 0, 1)
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2
}
/** progress within [lo, hi], clamped 0..1 */
function seg(p: number, lo: number, hi: number) {
  return THREE.MathUtils.clamp((p - lo) / (hi - lo), 0, 1)
}

type PackSceneProps = {
  progressRef: MutableRefObject<number>
}

const PackScene: React.FC<PackSceneProps> = ({ progressRef }) => {
  const { viewport } = useThree()

  const moveRef = useRef<THREE.Group>(null) // translate-in
  const spinRef = useRef<THREE.Group>(null) // the 360° Y flip
  const backdropRef = useRef<THREE.Mesh>(null) // faint backdrop card, flips back→front

  const reduceMotion = useRef(false)
  useEffect(() => {
    reduceMotion.current = prefersReducedMotion()
  }, [])

  // Real front / back artwork (cropped from the supplied dieline).
  const [frontTex, backTex] = useLoader(THREE.TextureLoader, [
    '/dream-box-front.jpg',
    '/dream-box-back.jpg',
  ])
  useEffect(() => {
    for (const t of [frontTex, backTex]) {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      t.needsUpdate = true
    }
  }, [frontTex, backTex])

  const { bodyMats, shadowMat, backdropMats, disposables } = useMemo(() => {
    const spine = makeSpineTexture()
    const shadowTex = makeShadowTexture()
    const bdFront = makeBackdropCardFront()
    const bdBack = makeBackdropCardBack()

    const std = (opts: THREE.MeshStandardMaterialParameters) =>
      new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0, ...opts })

    const front = std({ map: frontTex })
    const back = std({ map: backTex })
    const side = std({ map: spine })
    const capTop = std({ color: '#b31c19' })
    const capBottom = std({ color: '#9c1a17' })
    // BoxGeometry face order: +x, -x, +y, -y, +z (front), -z (back)
    const body = [side, side, capTop, capBottom, front, back]

    const shadow = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })

    const bdMat = (map: THREE.Texture) =>
      new THREE.MeshBasicMaterial({
        map,
        transparent: true,
        opacity: BD_OPACITY,
        depthWrite: false,
        toneMapped: false,
      })
    const bdInvisible = new THREE.MeshBasicMaterial({ visible: false })
    const bdFrontMat = bdMat(bdFront)
    const bdBackMat = bdMat(bdBack)
    // thin box: +x,-x,+y,-y edges hidden, +z = front, -z = back
    const bdMats = [bdInvisible, bdInvisible, bdInvisible, bdInvisible, bdFrontMat, bdBackMat]

    return {
      bodyMats: body,
      shadowMat: shadow,
      backdropMats: bdMats,
      disposables: [
        spine, shadowTex, bdFront, bdBack, front, back, side, capTop, capBottom,
        shadow, bdInvisible, bdFrontMat, bdBackMat,
      ],
    }
  }, [frontTex, backTex])

  useEffect(() => () => disposables.forEach((d) => d.dispose()), [disposables])

  // Off-screen start X depends on the viewport width.
  const startX = -viewport.width / 2 - BOX_W

  // Last accepted progress. ScrollTrigger can momentarily report ~0 during a
  // refresh; that would make the box lurch back toward the start for a frame.
  const heldP = useRef(0)

  useFrame((_s, delta) => {
    const raw = reduceMotion.current ? 1 : progressRef.current
    // Reject a single-frame collapse to near-zero from a high value (belt-and-
    // braces against any stray scroll value).
    if (!(raw < 0.15 && heldP.current > 0.6)) heldP.current = raw
    const p = heldP.current
    const L = reduceMotion.current ? 999 : 7
    const damp = THREE.MathUtils.damp

    const lerp = THREE.MathUtils.lerp

    // ---- X position ----------------------------------------------------
    let targetX: number
    if (p < P_ENTER) {
      targetX = lerp(startX, REST_X, easeOut(seg(p, 0, P_ENTER)))
    } else if (p < P_HOLD) {
      targetX = REST_X
    } else {
      targetX = lerp(REST_X, END_X, easeInOut(seg(p, P_HOLD, P_MOVE)))
    }

    // ---- Y rotation --------------------------------------------------
    // 0 → 2π over the entrance, hold, then +π (→ back) over the move.
    let targetRotY: number
    if (p < P_ENTER) {
      targetRotY = seg(p, 0, P_ENTER) * Math.PI * 2
    } else if (p < P_HOLD) {
      targetRotY = Math.PI * 2
    } else {
      targetRotY = Math.PI * 2 + easeInOut(seg(p, P_HOLD, P_MOVE)) * Math.PI
    }

    if (moveRef.current) {
      moveRef.current.position.x = damp(moveRef.current.position.x, targetX, L, delta)
    }
    if (spinRef.current) {
      spinRef.current.rotation.y = damp(spinRef.current.rotation.y, targetRotY, L, delta)
    }
    if (backdropRef.current) {
      // Back (π) → front (0), slowly, over the transition slice.
      const bd = Math.PI * (1 - easeInOut(seg(p, BD_FLIP_FROM, BD_FLIP_TO)))
      backdropRef.current.rotation.y = damp(backdropRef.current.rotation.y, bd, 4, delta)
    }
  })

  return (
    <>
      {/* Faint slanted playing card behind everything — starts on its back,
          turns to its front during the transition. Watermark-quiet. */}
      <group position={BD_POS} rotation={BD_SLANT}>
        <mesh ref={backdropRef} material={backdropMats} rotation={[0, Math.PI, 0]}>
          <boxGeometry args={[BD_W, BD_H, 0.02]} />
        </mesh>
      </group>

      <group ref={moveRef} position={[startX, REST_Y, 0]} rotation={[VIEW_TILT_X, 0, 0]}>
      {/* Ground shadow — moves with the box, doesn't spin. */}
      <mesh
        material={shadowMat}
        position={[0, -BOX_H / 2 - 0.35, 0]}
        rotation={[-Math.PI / 2 - VIEW_TILT_X, 0, 0]}
      >
        <planeGeometry args={[BOX_W * 2.4, BOX_D * 6]} />
      </mesh>

      {/* The box — spins a full 360° about Y. */}
      <group ref={spinRef}>
        <mesh material={bodyMats} castShadow>
          <boxGeometry args={[BOX_W, BOX_H, BOX_D]} />
        </mesh>
      </group>
      </group>
    </>
  )
}

export default PackScene
