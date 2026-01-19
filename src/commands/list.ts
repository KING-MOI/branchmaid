import type { Context } from "../context.js";
import { renderEntries } from "../render.js";
import { scan } from "../scan.js";

export function list(ctx: Context): number {
  const entries = scan(
    { base: ctx.base, staleAfter: ctx.staleAfter, protected: ctx.config.protected },
    ctx.cwd,
  );
  entries.sort((a, b) => b.age - a.age);
  if (ctx.flags.json) {
    console.log(JSON.stringify(entries, null, 2));
    return 0;
  }
  console.log(renderEntries(entries));
  return 0;
}
