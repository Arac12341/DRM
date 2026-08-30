/** @type {import('next').NextConfig} */
// Make `basePath` configurable via env so local dev runs at `/` while
// production builds can target a repo subpath (e.g. `/DRM`).
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || ''
const nextConfig = {
  output: 'export',
  // Only set `basePath` when `NEXT_PUBLIC_BASE_PATH` is provided.
  ...(BASE ? { basePath: BASE } : {}),
}

module.exports = nextConfig
