import React, { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * ParticleSphere
 * ----------------------------------------------------------------------------
 * A translucent, grainy sphere built from a single BufferGeometry of points.
 *
 * Design notes:
 *  - ONE geometry, ONE material, created once via useMemo. Nothing in here is
 *    re-allocated per frame or per render — the only per-frame work is bumping
 *    a `uTime` uniform (cheap).
 *  - Points sit on a spherical shell with a little random jitter so the surface
 *    reads as a cloud rather than a hard ball.
 *  - The vertex shader pushes each point in/out along its normal using 3D value
 *    noise, giving a slow "breathing" churn.
 *  - The fragment shader draws each point as a soft circular sprite and adds a
 *    per-pixel hash grain, then composites with additive blending so overlapping
 *    points glow. depthWrite is off so it layers cleanly with the planes.
 *
 * Tunables you may want to touch are marked `TUNE:`.
 * Brand colour swap points are marked `SWAP:`.
 */

type ParticleSphereProps = {
  /** TUNE: point count. 5000 is comfortable on a mid laptop. Drop to ~2500 for low-end. */
  count?: number
  /** TUNE: base sphere radius in world units. */
  radius?: number
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;

  attribute float aScale; // per-point size variation (0..1)

  varying float vNoise;

  // --- compact 3D value noise (self-contained, no external lib) ---------------
  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }
  float valueNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f); // smoothstep interpolant
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), u.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), u.x), u.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), u.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), u.x), u.y),
      u.z
    );
  }

  void main() {
    vec3 dir = normalize(position);

    // Slow churn: sample noise in a field that drifts over time.
    float n = valueNoise(position * 1.6 + uTime * 0.15);
    vNoise = n;

    // Displace along the radial normal. TUNE: 0.18 = churn amplitude.
    vec3 displaced = position + dir * (n - 0.5) * 0.18;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Perspective-correct point size (closer points are bigger).
    gl_PointSize = uSize * uPixelRatio * (0.4 + aScale) * (1.0 / -mvPosition.z);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying float vNoise;

  void main() {
    // Circular sprite: gl_PointCoord is 0..1 across the point quad.
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;                       // clip to a disc
    float soft = smoothstep(0.5, 0.0, d);       // feathered edge

    // Per-pixel grain so the cloud looks filmic rather than plasticky.
    float grain = fract(sin(dot(gl_PointCoord, vec2(12.9898, 78.233))) * 43758.5453);

    vec3 color = mix(uColorA, uColorB, clamp(vNoise, 0.0, 1.0));

    // Overall alpha: soft edge * noise-driven brightness * grain, kept low so
    // additive blending accumulates into a glow instead of blowing out.
    float alpha = soft * (0.25 + 0.75 * vNoise) * (0.55 + 0.45 * grain) * 0.6;

    gl_FragColor = vec4(color, alpha);
  }
`

const ParticleSphere: React.FC<ParticleSphereProps> = ({ count = 5000, radius = 1.25 }) => {
  // Build geometry once. Positions live on a spherical shell + jitter.
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const scales = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Uniform point-on-sphere sampling (avoids clustering at the poles).
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      const jitter = 1 + (Math.random() - 0.5) * 0.12 // fuzzy shell
      const r = radius * jitter

      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      scales[i] = Math.random()
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    return geo
  }, [count, radius])

  // Build material once.
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 26 }, // TUNE: base point size
        uPixelRatio: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1 },
        // SWAP: brand colours for the sphere glow (inner / outer).
        uColorA: { value: new THREE.Color('#6b8cff') },
        uColorB: { value: new THREE.Color('#c9d6ff') },
      },
    })
  }, [])

  // Dispose GPU resources when the component unmounts.
  React.useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  // Per-frame: only advance the time uniform (no allocations).
  useFrame((_state, delta) => {
    material.uniforms.uTime.value += delta
  })

  return <points geometry={geometry} material={material} />
}

export default ParticleSphere
