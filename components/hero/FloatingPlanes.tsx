import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * FloatingPlanes
 * ----------------------------------------------------------------------------
 * 6–10 flat, transparent "cutout" images floating at varying depths.
 *
 * RIGHT NOW these are procedurally-generated colour cards (a <canvas> gradient
 * with an index label) so the scene is testable with zero external assets.
 *
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │ SWAP: replace with your real transparent PNG cutouts.                │
 *  │ 1. Drop files in /public/cutouts/01.png … 08.png                    │
 *  │ 2. import { useTexture } from '@react-three/drei'                   │
 *  │ 3. const textures = useTexture(CUTOUTS.map(c => c.src))            │
 *  │ 4. Use <meshBasicMaterial map={textures[i]} transparent /> and set │
 *  │    the plane args to the image's aspect ratio.                     │
 *  │ Keep them power-of-two-ish and compressed; see README perf notes.  │
 *  └─────────────────────────────────────────────────────────────────────┘
 *
 * Performance:
 *  - ONE shared PlaneGeometry instance for every plane (see `sharedGeometry`).
 *  - Layout data (position / phase / colours) computed once via useMemo.
 *  - Per frame we only mutate mesh.position / mesh.rotation — no allocations,
 *    no geometry or material churn.
 */

// TUNE: how many planes (spec asks for 6–10).
const PLANE_COUNT = 8

// SWAP: brand palette for the placeholder cards.
const PALETTE = ['#ff5c7c', '#5c9dff', '#ffd15c', '#ff3b30', '#2dd4bf', '#f97316']

/** Draw a simple gradient + label into a canvas and wrap it as a texture. */
function makePlaceholderTexture(index: number, color: string): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, color)
  grad.addColorStop(1, '#0b0f14')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = 'bold 96px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(index + 1), size / 2, size / 2 + 4)

  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 8
  ctx.strokeRect(4, 4, size - 8, size - 8)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

type PlaneDatum = {
  basePosition: THREE.Vector3
  scale: number
  /** phase offset so planes don't bob in unison */
  phase: number
  /** individual drift speed */
  speed: number
  texture: THREE.CanvasTexture
}

const FloatingPlanes: React.FC = () => {
  // Refs to each mesh so useFrame can nudge them without React re-renders.
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])

  // One geometry for all planes. args are [width, height]; we scale per-mesh.
  const sharedGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  // Compute per-plane layout + build textures exactly once.
  const planes = useMemo<PlaneDatum[]>(() => {
    const out: PlaneDatum[] = []
    for (let i = 0; i < PLANE_COUNT; i++) {
      // Spread horizontally, keep vertical range tighter, stagger depth so the
      // camera flies "between" them on scroll.
      const x = (Math.random() - 0.5) * 7
      const y = (Math.random() - 0.5) * 3.2
      const z = -1.5 - i * 1.4 - Math.random() * 0.8

      out.push({
        basePosition: new THREE.Vector3(x, y, z),
        scale: 1.1 + Math.random() * 1.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.5,
        texture: makePlaceholderTexture(i, PALETTE[i % PALETTE.length]),
      })
    }
    return out
  }, [])

  // Cleanup GPU resources on unmount.
  React.useEffect(() => {
    return () => {
      sharedGeometry.dispose()
      planes.forEach((p) => p.texture.dispose())
    }
  }, [sharedGeometry, planes])

  // Gentle idle motion: bob on Y, drift rotation. Time-based (delta) so it runs
  // at the same speed regardless of frame rate.
  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < planes.length; i++) {
      const mesh = meshRefs.current[i]
      if (!mesh) continue
      const p = planes[i]
      mesh.position.y = p.basePosition.y + Math.sin(t * p.speed + p.phase) * 0.18
      mesh.position.x = p.basePosition.x + Math.cos(t * p.speed * 0.6 + p.phase) * 0.08
      mesh.rotation.z = Math.sin(t * 0.2 + p.phase) * 0.05
    }
  })

  return (
    <group>
      {planes.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el
          }}
          geometry={sharedGeometry}
          position={p.basePosition}
          scale={[p.scale * 1.6, p.scale, 1]} // 1.6:1 card aspect
        >
          <meshBasicMaterial
            map={p.texture}
            transparent
            opacity={0.92}
            side={THREE.DoubleSide}
            depthWrite={false} // let transparent planes overlap without z-fighting
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

export default FloatingPlanes
