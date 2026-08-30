/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export static HTML (no SSR). Required for GitHub Pages static deployment.
  output: 'export',
  // If you host on GitHub Pages under a subpath, set `basePath` accordingly.
  // For project pages (https://<user>.github.io/<repo>/) set the repo name here.
  basePath: '/DRM',
  // Ensure static assets are requested from the same base path.
  assetPrefix: '/DRM',
}

module.exports = nextConfig
