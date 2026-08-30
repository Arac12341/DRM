import React, { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * PlayingCard
 * ----------------------------------------------------------------------------
 * A single playing card: a thin box so it has real edge thickness during the
 * flip. Six materials, in BoxGeometry's face order [ +x, -x, +y, -y, +z, -z ]:
 *   - +z (index 4) = FRONT  -> the card face, points at the camera at rest
 *   - -z (index 5) = BACK   -> the card back pattern
 *   - the other four = the paper-white edge
 *
 * The face + back are drawn to <canvas> at load, so there are ZERO external
 * assets. Everything (geometry, textures, materials) is built once in useMemo
 * and disposed on unmount — nothing is recreated per frame or per render.
 *
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │ SWAP: real card art.                                                 │
 *  │  1. drop /public/card-front.png and /public/card-back.png           │
 *  │     (portrait, ~2.5 : 3.5 ratio, e.g. 750×1050)                     │
 *  │  2. import { useTexture } from '@react-three/drei'                  │
 *  │  3. const [front, back] = useTexture(['/card-front.png',           │
 *  │       '/card-back.png'])  // then delete makeFrontTexture/makeBack  │
 *  │  4. keep front.colorSpace = THREE.SRGBColorSpace                    │
 *  └─────────────────────────────────────────────────────────────────────┘
 */

// Standard playing-card proportions (2.5" × 3.5"). Height in world units.
const CARD_H = 3.0
const CARD_W = CARD_H * (2.5 / 3.5)
const CARD_D = 0.03 // thickness

// Texture canvas size (keeps the 2.5:3.5 ratio).
const TEX_W = 512
const TEX_H = 716

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** One corner index: rank letter above a small suit glyph. */
function drawCorner(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${TEX_H * 0.075}px Georgia, "Times New Roman", serif`
  ctx.fillText('J', TEX_W * 0.13, TEX_H * 0.1)
  ctx.font = `${TEX_H * 0.06}px Georgia, serif`
  ctx.fillText('♥', TEX_W * 0.13, TEX_H * 0.17)
}

function makeFrontTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_W
  canvas.height = TEX_H
  const ctx = canvas.getContext('2d')!
  const red = '#c8102e'

  // Paper
  ctx.fillStyle = '#fbfaf5'
  roundRect(ctx, 0, 0, TEX_W, TEX_H, TEX_W * 0.07)
  ctx.fill()

  // Hairline frame
  ctx.strokeStyle = 'rgba(0,0,0,0.14)'
  ctx.lineWidth = TEX_W * 0.012
  roundRect(ctx, TEX_W * 0.05, TEX_H * 0.035, TEX_W * 0.9, TEX_H * 0.93, TEX_W * 0.05)
  ctx.stroke()

  // Corner indices — top-left, then the same rotated 180° into bottom-right
  drawCorner(ctx, red)
  ctx.save()
  ctx.translate(TEX_W, TEX_H)
  ctx.rotate(Math.PI)
  drawCorner(ctx, red)
  ctx.restore()

  // Centre motif
  ctx.fillStyle = red
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${TEX_H * 0.3}px Georgia, "Times New Roman", serif`
  ctx.fillText('J', TEX_W / 2, TEX_H * 0.42)
  ctx.font = `${TEX_H * 0.2}px Georgia, serif`
  ctx.fillText('♥', TEX_W / 2, TEX_H * 0.66)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeBackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_W
  canvas.height = TEX_H
  const ctx = canvas.getContext('2d')!
  const ink = '#0b3d91' // deep blue

  // Bleed + white margin + inner panel
  ctx.fillStyle = ink
  roundRect(ctx, 0, 0, TEX_W, TEX_H, TEX_W * 0.07)
  ctx.fill()
  ctx.fillStyle = '#fbfaf5'
  roundRect(ctx, TEX_W * 0.03, TEX_H * 0.022, TEX_W * 0.94, TEX_H * 0.956, TEX_W * 0.055)
  ctx.fill()
  ctx.fillStyle = ink
  roundRect(ctx, TEX_W * 0.07, TEX_H * 0.05, TEX_W * 0.86, TEX_H * 0.9, TEX_W * 0.04)
  ctx.fill()

  // Diagonal lattice, clipped to the inner panel
  ctx.save()
  roundRect(ctx, TEX_W * 0.07, TEX_H * 0.05, TEX_W * 0.86, TEX_H * 0.9, TEX_W * 0.04)
  ctx.clip()
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'
  ctx.lineWidth = 2
  const step = TEX_W * 0.1
  for (let i = -TEX_H; i < TEX_W + TEX_H; i += step) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + TEX_H, TEX_H)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(i, TEX_H)
    ctx.lineTo(i + TEX_H, 0)
    ctx.stroke()
  }
  ctx.restore()

  // Centre emblem
  ctx.fillStyle = '#fbfaf5'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${TEX_H * 0.12}px Georgia, serif`
  ctx.fillText('♦', TEX_W / 2, TEX_H / 2)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

const PlayingCard: React.FC = () => {
  const { gl } = useThree()

  const front = useMemo(makeFrontTexture, [])
  const back = useMemo(makeBackTexture, [])

  // Keep the face crisp when the card is near edge-on during the flip.
  useEffect(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy()
    front.anisotropy = maxAniso
    back.anisotropy = maxAniso
    front.needsUpdate = true
    back.needsUpdate = true
  }, [gl, front, back])

  const materials = useMemo(() => {
    const edge = new THREE.MeshBasicMaterial({ color: '#e9e7df', toneMapped: false })
    const faceFront = new THREE.MeshBasicMaterial({ map: front, toneMapped: false })
    const faceBack = new THREE.MeshBasicMaterial({ map: back, toneMapped: false })
    // BoxGeometry face order: +x, -x, +y, -y, +z (front), -z (back)
    return [edge, edge, edge, edge, faceFront, faceBack]
  }, [front, back])

  useEffect(() => {
    return () => {
      front.dispose()
      back.dispose()
      materials[0].dispose() // shared edge material
      materials[4].dispose()
      materials[5].dispose()
    }
  }, [front, back, materials])

  return (
    <mesh material={materials} castShadow={false} receiveShadow={false}>
      <boxGeometry args={[CARD_W, CARD_H, CARD_D]} />
    </mesh>
  )
}

export default PlayingCard
