import { Hanken_Grotesk, JetBrains_Mono, Unbounded } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Provider } from "@/components/provider.tsx";
import { absoluteUrl, basePath, homepageSeo, orgUrl, repoUrl, siteUrl } from "@/lib/site.ts";
import "./global.css";

const unbounded = Unbounded({ subsets: ["latin"], variable: "--font-unbounded", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		default: homepageSeo.title,
		template: "%s | FangDash",
	},
	description: homepageSeo.description,
	applicationName: "FangDash",
	keywords: [...homepageSeo.keywords],
	authors: [{ name: "MrDemonWolf, Inc.", url: orgUrl }],
	creator: "MrDemonWolf, Inc.",
	publisher: "MrDemonWolf, Inc.",
	icons: {
		icon: [
			{ url: `${basePath}/icons/icon-head.svg`, type: "image/svg+xml" },
			{ url: `${basePath}/icons/icon-32.png`, sizes: "32x32", type: "image/png" },
			{ url: `${basePath}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
		],
		apple: `${basePath}/icons/icon-192.png`,
	},
	alternates: { canonical: siteUrl },
	openGraph: {
		type: "website",
		locale: "en_US",
		url: siteUrl,
		siteName: "FangDash",
		title: homepageSeo.title,
		description: homepageSeo.socialDescription,
		images: [
			{
				url: absoluteUrl("/opengraph-image.png"),
				width: 1200,
				height: 630,
				alt: homepageSeo.ogImageAlt,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		site: "@mrdemonwolf",
		creator: "@mrdemonwolf",
		title: homepageSeo.title,
		description: homepageSeo.socialDescription,
		images: [absoluteUrl("/opengraph-image.png")],
	},
};

const jsonLd = {
	"@context": "https://schema.org",
	"@type": "VideoGame",
	name: "FangDash",
	description: homepageSeo.description,
	url: siteUrl,
	image: absoluteUrl("/opengraph-image.png"),
	applicationCategory: "Game",
	genre: ["Endless runner", "Multiplayer", "Arcade"],
	gamePlatform: "Web browser",
	operatingSystem: "Any (web browser)",
	playMode: ["SinglePlayer", "MultiPlayer"],
	inLanguage: "en",
	offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
	author: { "@type": "Organization", name: "MrDemonWolf, Inc.", url: orgUrl },
	publisher: { "@type": "Organization", name: "MrDemonWolf, Inc.", url: orgUrl },
	license: `${repoUrl}/blob/main/LICENSE`,
	sameAs: [repoUrl, "https://www.mrdemonwolf.com"],
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			className={`${unbounded.variable} ${hanken.variable} ${jetbrains.variable}`}
			suppressHydrationWarning={true}
		>
			<body className="fd-font flex min-h-screen flex-col">
				<a href="#nd-page" className="skip-nav">
					Skip to content
				</a>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
				<Provider>{children}</Provider>
			</body>
		</html>
	);
}
