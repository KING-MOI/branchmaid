import { type Context, scanRepo } from "../context.js";
import { git } from "../git.js";
import { renderEntries } from "../render.js";
import type { Entry } from "../scan.js";

const SORTERS: Record<string, (a: Entry, b: Entry) => number> = {
  age: (a, b) => b.age - a.age,
  name: (a, b) => a.branch.name.localeCompare(b.branch.name),
  author: (a, b) => a.branch.author.localeCompare(b.branch.author) || b.age - a.age,
};

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
  const sort = ctx.flags.sort ?? "age";
  if (!(sort in SORTERS))
    throw new Error(`unknown sort key: ${sort} (use ${Object.keys(SORTERS).join(", ")})`);
  shown.sort(SORTERS[sort]);
  if (ctx.flags.limit) shown = shown.slice(0, Number(ctx.flags.limit));
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
