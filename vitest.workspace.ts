import { defineWorkspace } from "vitest/config";

// biome-ignore lint/style/noDefaultExport: required by framework config
export default defineWorkspace(["packages/shared", "apps/api"]);
