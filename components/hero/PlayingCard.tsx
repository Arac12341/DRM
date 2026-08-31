import React, { useEffect, useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * PlayingCard
 * ----------------------------------------------------------------------------
 * A single playing card: a thin box so it has real edge thickness during the
 * flip. Six materials, in BoxGeometry's face order [ +x, -x, +y, -y, +z, -z ]:
 *   - +z (index 4) = FRONT -> the DREAM "Ace of Spades" face
 *   - -z (index 5) = BACK  -> the red filigree back
 *   - the other four = the paper-white edge
 *
 * Art is the approved product-sleeve raster, extracted from the embedded PNG in
 * /public/DREAM-front-embedded (1).svg / DREAM-back-embedded.svg, cropped to the
 * printed design (no white substrate/foil border) -> /public/card-front.jpg and
 * /public/card-back.jpg. Loaded once via useLoader, so this component MUST be
 * rendered inside a <Suspense> boundary (see HeroScene).
 */

// Art cropped to the SVG's printed region (border keyline kept); the light
// corner/edge substrate is recoloured to the card red. Both faces are 473 × 708.
const CARD_H = 3.0
const CARD_W = CARD_H * (473 / 708)
const CARD_D = 0.03 // thickness

// Prefix assets with NEXT_PUBLIC_BASE_PATH so they resolve when the site is
// hosted at a subpath; empty string for the custom-domain root.
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')

const PlayingCard: React.FC = () => {
  const [front, back] = useLoader(THREE.TextureLoader, [
    `${BASE}/card-front.jpg`,
    `${BASE}/card-back.jpg`,
  ])

  // sRGB decode + a little anisotropy so the face stays crisp when the card is
  // near edge-on during the flip.
  useEffect(() => {
    for (const t of [front, back]) {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      t.needsUpdate = true
    }
  }, [front, back])

  const materials = useMemo(() => {
    const edge = new THREE.MeshBasicMaterial({ color: '#7c1512', toneMapped: false })
    const faceFront = new THREE.MeshBasicMaterial({ map: front, toneMapped: false })
    const faceBack = new THREE.MeshBasicMaterial({ map: back, toneMapped: false })
    // BoxGeometry face order: +x, -x, +y, -y, +z (front), -z (back)
    return [edge, edge, edge, edge, faceFront, faceBack]
  }, [front, back])

  useEffect(() => {
    return () => {
      materials[0].dispose() // shared edge material
      materials[4].dispose()
      materials[5].dispose()
    }
  }, [materials])

  return (
    <mesh material={materials} castShadow={false} receiveShadow={false}>
      <boxGeometry args={[CARD_W, CARD_H, CARD_D]} />
    </mesh>
  )
}

export default PlayingCard
