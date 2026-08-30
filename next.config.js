/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export static HTML (no SSR). Required for GitHub Pages static deployment.
  output: 'export',
  // If you host on GitHub Pages under a subpath, set `basePath` accordingly.
  // basePath: '/your-repo-name',
}

module.exports = nextConfig
