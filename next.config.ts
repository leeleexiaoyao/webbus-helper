import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 允许访问本地图片
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
