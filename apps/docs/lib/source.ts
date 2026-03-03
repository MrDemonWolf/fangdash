import { docs } from "@/.source";
import { loader } from "fumadocs-core/source";

// fumadocs-mdx@11.5+ returns files as a lazy function,
// but fumadocs-core@15.x expects an array — resolve it here.
const raw = docs.toFumadocsSource();
const files =
  typeof raw.files === "function"
    ? (raw.files as unknown as () => typeof raw.files)()
    : raw.files;

export const source = loader({
  baseUrl: "/docs",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source: { ...raw, files } as any,
});
