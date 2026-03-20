import { defineWorkspace } from "vitest/config";

export default defineWorkspace(["packages/shared", "packages/game", "apps/api", "apps/party", "apps/web"]);
