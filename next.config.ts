import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The view-only viewer is meant to be embedded anywhere via <iframe>.
  async headers() {
    return [
      {
        source: '/v/:path*',
        headers: [{ key: 'Content-Security-Policy', value: 'frame-ancestors *' }],
      },
    ];
  },
};

export default nextConfig;
