import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "巴士认座助手",
    short_name: "认座助手",
    id: "/",
    description: "巴士出行认座、互动工具",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "portrait",
    background_color: "#f4f4f3",
    theme_color: "#ff5336",
    lang: "zh-CN",
    categories: ["travel", "productivity", "utilities"],
    icons: [
      {
        src: "/pwa-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/pwa-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "创建车次",
        short_name: "创建",
        description: "快速创建新的车次",
        url: "/create-trip",
        icons: [
          {
            src: "/shortcut-create.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "加入车次",
        short_name: "加入",
        description: "输入口令快速加入车次",
        url: "/join-trip",
        icons: [
          {
            src: "/shortcut-join.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
    screenshots: [
      {
        src: "/screenshot-home.png",
        sizes: "512x512",
        type: "image/png",
        form_factor: "narrow",
        label: "首页与认座入口",
      },
      {
        src: "/screenshot-tools.png",
        sizes: "512x512",
        type: "image/png",
        form_factor: "narrow",
        label: "工具页与互动玩法",
      },
    ],
  };
}
