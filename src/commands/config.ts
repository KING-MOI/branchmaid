import pc from "picocolors";
import { resolveConfig } from "../config.js";
import type { Context } from "../context.js";
import { repoRoot } from "../git.js";

export function config(ctx: Context): number {
  const { config, source } = resolveConfig(repoRoot(ctx.cwd));
  console.error(pc.dim(`source: ${source ?? "defaults"}`));
  console.log(JSON.stringify(config, null, 2));
  return 0;
}
