import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Admin forms upload restaurant and dish pictures through Server Actions.
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
