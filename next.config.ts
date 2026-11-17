import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A second E2E build (the llm-ui Playwright project) goes to its own folder (haunted-house-ui design, "E2E setup").
  distDir: process.env.HC_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
