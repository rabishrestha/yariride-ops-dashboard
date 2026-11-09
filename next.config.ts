import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true, // <-- Add this line
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;