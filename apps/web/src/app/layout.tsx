import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { Navbar } from "@/components/ui/Navbar";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#091533",
};

export const metadata: Metadata = {
  title: "FangDash",
  description:
    "A multiplayer endless runner where players race as wolves on Twitch.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FangDash",
  },
  openGraph: {
    title: "FangDash",
    description:
      "A multiplayer endless runner where players race as wolves on Twitch.",
    type: "website",
    siteName: "FangDash",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "FangDash" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FangDash",
    description:
      "A multiplayer endless runner where players race as wolves on Twitch.",
    images: ["/api/og"],
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[var(--color-fang-darker)] text-white min-h-screen">
        <Providers>
          <ServiceWorkerRegistration />
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
