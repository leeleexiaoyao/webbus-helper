import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许访问本地图片
  images: {
    unoptimized: true,
  },
  // serverExternalPackages 用于 better-sqlite3
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
