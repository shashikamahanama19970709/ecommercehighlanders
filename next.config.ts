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
        hostname: 's3.us-east-005.backblazeb2.com',
      },
      {
        protocol: 'https',
        hostname: 's3.us-west-002.backblazeb2.com',
      },
    ],
    // Increase cache time for external images
    minimumCacheTTL: 3600, // 1 hour
    // Allow SVG images
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
