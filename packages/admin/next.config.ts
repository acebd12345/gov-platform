import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@gov/shared'],
  // standalone produces a self-contained server build under .next/standalone
  // including only the node_modules actually used at runtime. This keeps the
  // production image small and avoids needing the whole monorepo at runtime.
  output: 'standalone',
  // The standalone tracer needs to know where the monorepo root is so it
  // copies workspace packages (e.g. @gov/shared) into .next/standalone.
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
