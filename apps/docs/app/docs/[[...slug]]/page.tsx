import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { source } from "@/lib/source.ts";
import { getMDXComponents } from "@/mdx-components.tsx";

interface Props {
	params: Promise<{ slug?: string[] }>;
}

// biome-ignore lint/style/noDefaultExport: required by Next.js
export default async function Page({ params }: Props) {
	const { slug } = await params;
	const page = source.getPage(slug);
	if (!page) {
		notFound();
	}

	// fumadocs-mdx adds body/toc/full at runtime but the type is lost
	// due to the files-function compatibility shim in lib/source.ts
	// biome-ignore lint/suspicious/noExplicitAny: fumadocs API typing
	const data = page.data as any;
	const MDX = data.body;

	return (
		<DocsPage toc={data.toc} full={data.full}>
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription>{page.data.description}</DocsDescription>
			<DocsBody>
				<MDX components={getMDXComponents()} />
			</DocsBody>
		</DocsPage>
	);
}

// biome-ignore lint/suspicious/useAwait: Next.js static params generation
export async function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const page = source.getPage(slug);
	if (!page) {
		notFound();
	}

	return {
		title: page.data.title,
		description: page.data.description,
	};
}
