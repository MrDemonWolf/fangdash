import { source } from "@/lib/source.ts";
import { createFromSource } from "fumadocs-core/search/server";

export const revalidate = false;

// Static search index for the exported site. `staticGET` writes a JSON index at
// build time that the client Orama instance loads (see components/search.tsx).
export const { staticGET: GET } = createFromSource(source, {
	language: "english",
});
