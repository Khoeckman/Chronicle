const isProd = process.env.NODE_ENV === 'production'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: isProd ? 'docs' : 'out',
  basePath: isProd ? '/TafelKampioen' : '',
  assetPrefix: isProd ? '/TafelKampioen' : '',
}

export default nextConfig
