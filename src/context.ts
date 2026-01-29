import type { Config } from "./config.js";
import { type Entry, scan } from "./scan.js";

export interface Context {
  cwd: string;
  config: Config;
  base: string;
  staleAfter: number;
  flags: {
    json?: boolean;
    merged?: boolean;
    gone?: boolean;
    stale?: boolean;
    squash?: boolean;
  };
}

export function scanRepo(ctx: Context): Entry[] {
  return scan(
    {
      base: ctx.base,
      staleAfter: ctx.staleAfter,
      protected: ctx.config.protected,
      squash: ctx.flags.squash ?? ctx.config.squash,
    },
    ctx.cwd,
  );
}
