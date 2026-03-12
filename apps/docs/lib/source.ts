import { loader } from "fumadocs-core/source";
import { docs } from "@/.source/index.ts";

// fumadocs-mdx@11.5+ returns files as a lazy function,
// but fumadocs-core@15.x expects an array — resolve it here.
const raw = docs.toFumadocsSource();
const files =
	typeof raw.files === "function"
		? (raw.files as unknown as () => typeof raw.files)()
		: raw.files;

export const source = loader({
	baseUrl: "/docs",
	// biome-ignore lint/suspicious/noExplicitAny: fumadocs API typing
	source: { ...raw, files } as any,
});
