import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@gov/shared', '@gov/ui'],
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),

  // 舊 .aspx 路徑 301 → 新路徑（向下相容）
  async redirects() {
    return [
      { source: '/News.aspx', destination: '/news', permanent: true },
      { source: '/News_Services.aspx', destination: '/services', permanent: true },
      { source: '/Content_List.aspx', destination: '/services', permanent: true },
      { source: '/Default.aspx', destination: '/', permanent: true },
      // hash → slug 對應表由日後 migration script 補；先放 .aspx 入口
    ];
  },
};

export default nextConfig;
