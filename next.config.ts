import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without this, Next.js's root
  // inference can walk up to an unrelated package.json/lockfile in the
  // user's home directory and misconfigure file tracing.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // lib/extraction/pdf-text.ts resolves its pdfjs worker/font-data paths
  // dynamically (path.join(process.cwd(), ...)), not via a static
  // import/require Next's file tracer can follow — so on a serverless
  // deploy those files could be silently left out of the function bundle.
  // Force-include them explicitly for the route that uses them.
  outputFileTracingIncludes: {
    "/api/process": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
      "./node_modules/pdfjs-dist/standard_fonts/**",
    ],
  },
};

export default nextConfig;
