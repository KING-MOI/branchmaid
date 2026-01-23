import type { Context } from "../context.js";
import { renderEntries } from "../render.js";
import { scan } from "../scan.js";

export function list(ctx: Context): number {
  const wanted: string[] = (["merged", "gone", "stale"] as const).filter((r) => ctx.flags[r]);
  if (ctx.flags.merged) wanted.push("squashed");
  const entries = scan(
    {
      base: ctx.base,
      staleAfter: ctx.staleAfter,
      protected: ctx.config.protected,
      squash: ctx.flags.squash ?? ctx.config.squash,
    },
    ctx.cwd,
  );
  const shown = wanted.length
    ? entries.filter((e) => !e.protected && e.reasons.some((r) => wanted.includes(r)))
    : entries;
  shown.sort((a, b) => b.age - a.age);
  if (ctx.flags.json) {
    console.log(JSON.stringify(shown, null, 2));
    return 0;
  }
  console.log(renderEntries(shown));
  return 0;
}
