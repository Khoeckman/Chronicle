const isProd = process.env.NODE_ENV === 'production'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: isProd ? 'docs' : 'out',
  basePath: isProd ? '/Chronicle' : '',
  assetPrefix: isProd ? '/Chronicle' : '',
}

export default nextConfig
