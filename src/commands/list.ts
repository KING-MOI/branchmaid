import type { Context } from "../context.js";
import { renderEntries } from "../render.js";
import { scan } from "../scan.js";

export function list(ctx: Context): number {
  const wanted = (["merged", "gone", "stale"] as const).filter((r) => ctx.flags[r]);
  const entries = scan(
    { base: ctx.base, staleAfter: ctx.staleAfter, protected: ctx.config.protected },
    ctx.cwd,
  );
  const shown = wanted.length
    ? entries.filter((e) => !e.protected && e.reasons.some((r) => (wanted as string[]).includes(r)))
    : entries;
  shown.sort((a, b) => b.age - a.age);
  if (ctx.flags.json) {
    console.log(JSON.stringify(shown, null, 2));
    return 0;
  }
  console.log(renderEntries(shown));
  return 0;
}
