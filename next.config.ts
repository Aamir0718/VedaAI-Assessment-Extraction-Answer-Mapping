import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without this, Next.js's root
  // inference can walk up to an unrelated package.json/lockfile in the
  // user's home directory and misconfigure file tracing.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
