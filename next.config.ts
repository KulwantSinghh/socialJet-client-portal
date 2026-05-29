// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone', // critical for Amplify SSR
}

export default nextConfig
