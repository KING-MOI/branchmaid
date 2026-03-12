import { type Context, scanRepo } from "../context.js";
import { git } from "../git.js";
import { renderEntries } from "../render.js";

export function list(ctx: Context): number {
  const wanted: string[] = (["merged", "gone", "stale"] as const).filter((r) => ctx.flags[r]);
  if (ctx.flags.merged) wanted.push("squashed");
  const entries = scanRepo(ctx);
  let shown = wanted.length
    ? entries.filter((e) => !e.protected && e.reasons.some((r) => wanted.includes(r)))
    : entries;
  if (ctx.flags.mine) {
    const email = git(["config", "user.email"], ctx.cwd);
    shown = shown.filter((e) => e.branch.email === email);
  }
  shown.sort((a, b) => b.age - a.age);
  if (ctx.flags.names) {
    for (const e of shown) console.log(e.branch.name);
    return 0;
  }
  if (ctx.flags.json) {
    console.log(JSON.stringify(shown, null, 2));
    return 0;
  }
  console.log(renderEntries(shown));
  return 0;
}
