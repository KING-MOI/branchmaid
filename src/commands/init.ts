import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pc from "picocolors";
import { DEFAULTS } from "../config.js";
import type { Context } from "../context.js";
import { repoRoot } from "../git.js";

export function init(ctx: Context): number {
  const file = join(repoRoot(ctx.cwd), ".branchmaidrc");
  if (existsSync(file)) {
    console.error(`${file} already exists`);
    return 1;
  }
  const body = { $schema: "./node_modules/branchmaid/schema.json", ...DEFAULTS };
  writeFileSync(file, `${JSON.stringify(body, null, 2)}\n`);
  console.log(`${pc.green("created")} ${file}`);
  return 0;
}
