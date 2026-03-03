import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { Navbar } from "@/components/ui/Navbar";
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
  manifest: "/manifest.json",
  themeColor: "#091533",
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
  },
  twitter: {
    card: "summary_large_image",
    title: "FangDash",
    description:
      "A multiplayer endless runner where players race as wolves on Twitch.",
  },
  icons: {
    icon: "/favicon.ico",
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
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
