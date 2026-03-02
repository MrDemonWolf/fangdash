import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "FangDash — Multiplayer Wolf Runner",
  description: "Race as wolves in this multiplayer endless runner!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[var(--color-fang-darker)] text-white min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
