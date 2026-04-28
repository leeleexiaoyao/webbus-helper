import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell/AppShell";
import { PwaRegistrar } from "@/components/pwa/PwaRegistrar";
import { ToastProvider } from "@/components/Toast/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "巴士认座助手",
  description: "巴士出行认座、互动工具",
  manifest: "/manifest.webmanifest",
  applicationName: "巴士认座助手",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "巴士认座助手",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
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
        <ToastProvider>
          <PwaRegistrar />
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
