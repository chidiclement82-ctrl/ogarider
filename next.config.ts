import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Development only: lets the app be opened at 127.0.0.1 as well as localhost, which
  // gives a second, separately signed-in browser session for testing.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // Admin forms upload restaurant and dish pictures through Server Actions.
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
