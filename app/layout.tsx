import type { Metadata, Viewport } from "next";
import { PwaRegistrar } from "@/components/pwa/PwaRegistrar";
import "./globals.css";

export const metadata: Metadata = {
  title: "巴士认座助手",
  description: "巴士出行认座、互动工具",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "巴士认座助手",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ff5336",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
