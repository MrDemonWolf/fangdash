import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { Navbar } from "@/components/ui/Navbar";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#091533",
};

export const metadata: Metadata = {
  title: "FangDash — Multiplayer Wolf Runner",
  description: "Race as wolves in this multiplayer endless runner!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FangDash",
  },
  openGraph: {
    title: "FangDash — Multiplayer Wolf Runner",
    description: "Race as wolves in this multiplayer endless runner!",
    url: "/",
    siteName: "FangDash",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FangDash — Multiplayer Wolf Runner",
      },
    ],
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
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
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
