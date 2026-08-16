import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    browserDebugInfoInTerminal: true,
    // `radix-ui` is a barrel of 35 eager `import * as` re-exports and is not in
    // Next's built-in list, so one `<Button>` drags all 35 primitive packages
    // into the dev module graph. Next merges this with its defaults.
    optimizePackageImports: ['radix-ui'],
  },
  reactCompiler: true,
  typedRoutes: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
