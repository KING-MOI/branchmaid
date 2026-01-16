import type { Context } from "../context.js";
import { renderEntries } from "../render.js";
import { scan } from "../scan.js";

export function list(ctx: Context): number {
  const entries = scan(
    { base: ctx.base, staleAfter: ctx.staleAfter, protected: ctx.config.protected },
    ctx.cwd,
  );
  console.log(renderEntries(entries));
  return 0;
}
