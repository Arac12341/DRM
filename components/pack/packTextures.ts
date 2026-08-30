import * as THREE from 'three'

/**
 * Canvas-drawn textures for the pack scene — the box spine and the strip.
 * The front / back panels use the real artwork (`useTexture` in PackScene).
 *
 * SWAP: replace `makeSpineTexture` with `useTexture('/dream-box-side.jpg')` if
 * you get a real side-panel image. Keep `colorSpace = SRGBColorSpace`.
 */

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

/** The narrow printed spine: brand red with vertical DREAM / ORAL STRIPS text. */
export function makeSpineTexture(): THREE.CanvasTexture {
  const W = 240
  const H = 900
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!

  ctx.fillStyle = '#ba201d'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#fffdf7'
  ctx.fillRect(W * 0.12, H * 0.02, W * 0.76, H * 0.96)
  ctx.fillStyle = '#ba201d'
  ctx.fillRect(W * 0.16, H * 0.03, W * 0.68, H * 0.52)

  ctx.save()
  ctx.translate(W / 2, H * 0.3)
  ctx.rotate(-Math.PI / 2)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fffdf7'
  ctx.font = `bold ${W * 0.5}px Georgia, "Times New Roman", serif`
  ctx.fillText('DREAM', 0, 0)
  ctx.restore()

  ctx.save()
  ctx.translate(W / 2, H * 0.78)
  ctx.rotate(-Math.PI / 2)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#101c3c'
  ctx.font = `bold ${W * 0.16}px Arial, sans-serif`
  ctx.fillText('O R A L   S T R I P S', 0, -W * 0.14)
  ctx.font = `bold ${W * 0.12}px Arial, sans-serif`
  ctx.fillText('20 STRIPS', 0, W * 0.16)
  ctx.restore()

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** Soft radial blob for a fake ground shadow. */
export function makeShadowTexture(): THREE.CanvasTexture {
  const S = 256
  const c = document.createElement('canvas')
  c.width = S
  c.height = S
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(0,0,0,0.34)')
  g.addColorStop(0.55, 'rgba(0,0,0,0.16)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** The single strip that peeks out — pale, faint DREAM mark. */
export function makeStripTexture(): THREE.CanvasTexture {
  const W = 360
  const H = 520
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!

  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#faf6ea')
  g.addColorStop(1, '#efe7d3')
  ctx.fillStyle = g
  roundRect(ctx, 0, 0, W, H, 14)
  ctx.fill()

  ctx.strokeStyle = 'rgba(16,28,60,0.16)'
  ctx.lineWidth = 3
  roundRect(ctx, 6, 6, W - 12, H - 12, 12)
  ctx.stroke()

  ctx.fillStyle = 'rgba(16,28,60,0.4)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${W * 0.11}px Georgia, serif`
  ctx.save()
  ctx.translate(W / 2, H * 0.16)
  ctx.scale(1, 1)
  // letter-spacing fake
  const s = 'DREAM'
  const sp = W * 0.11
  s.split('').forEach((ch, i) => ctx.fillText(ch, (i - (s.length - 1) / 2) * sp * 0.9, 0))
  ctx.restore()

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/**
 * Faint, transparent "playing card" textures for the white-section backdrop —
 * light grey line-art so it reads as a watermark and never competes with the
 * packaging. Front = spade + DREAM, back = diamond lattice.
 */
function backdropCanvas() {
  const W = 512
  const H = 716
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  return { W, H, ctx, c }
}
function finishBackdrop(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

export function makeBackdropCardBack(): THREE.CanvasTexture {
  const { W, H, ctx, c } = backdropCanvas()
  const ink = 'rgba(24,28,45,0.85)' // opacity is set low on the material
  ctx.strokeStyle = ink
  ctx.lineWidth = 5
  roundRect(ctx, 16, 16, W - 32, H - 32, 24)
  ctx.stroke()
  roundRect(ctx, 42, 42, W - 84, H - 84, 16)
  ctx.stroke()

  ctx.save()
  roundRect(ctx, 44, 44, W - 88, H - 88, 14)
  ctx.clip()
  ctx.lineWidth = 2
  const step = W * 0.11
  for (let i = -H; i < W + H; i += step) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + H, H)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(i, H)
    ctx.lineTo(i + H, 0)
    ctx.stroke()
  }
  ctx.restore()

  ctx.fillStyle = ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${H * 0.1}px Georgia, serif`
  ctx.fillText('♦', W / 2, H / 2)
  return finishBackdrop(c)
}

export function makeBackdropCardFront(): THREE.CanvasTexture {
  const { W, H, ctx, c } = backdropCanvas()
  const ink = 'rgba(24,28,45,0.8)'
  ctx.strokeStyle = ink
  ctx.lineWidth = 5
  roundRect(ctx, 16, 16, W - 32, H - 32, 24)
  ctx.stroke()

  ctx.fillStyle = ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${H * 0.4}px Georgia, "Times New Roman", serif`
  ctx.globalAlpha = 0.5
  ctx.fillText('♠', W / 2, H * 0.56)
  ctx.globalAlpha = 1

  ctx.font = `bold ${H * 0.09}px Georgia, serif`
  ctx.fillText('DREAM', W / 2, H * 0.2)

  ctx.font = `bold ${H * 0.06}px Georgia, serif`
  ctx.textAlign = 'left'
  ctx.fillText('A', 40, 56)
  ctx.textAlign = 'right'
  ctx.save()
  ctx.translate(W - 40, H - 56)
  ctx.rotate(Math.PI)
  ctx.fillText('A', 0, 0)
  ctx.restore()
  return finishBackdrop(c)
}
