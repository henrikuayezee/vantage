import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for the Docker standalone build
  output: 'standalone',

  // Proxy all /api/* requests to the NestJS backend.
  // This keeps the API URL server-side only (no NEXT_PUBLIC_ needed)
  // and avoids all CORS issues in production.
  async rewrites() {
    const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
