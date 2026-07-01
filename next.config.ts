import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: '*.backblazeb2.com',
      },
    ],
    localPatterns: [
      {
        pathname: '/**',
      },
    ],
    // Increase cache time for external images
    minimumCacheTTL: 3600, // 1 hour
    // Allow SVG images
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
