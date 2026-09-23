import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Life OS — سیستم‌عامل جامع مدیریت زندگی و حسابداری",
  description: "مرکز فرماندهی یکپارچه برای مدیریت اهداف، زمان، سلامت، یادگیری، پروژه‌ها و حسابداری کامل دوبل/مالی",
  manifest: "/manifest.webmanifest",
  applicationName: "Life OS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Life OS",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icons/icon.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased selection:bg-blue-600 selection:text-white bg-white text-zinc-950">
        <ServiceWorkerRegister />
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}

