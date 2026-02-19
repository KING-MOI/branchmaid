import type { Config } from "./config.js";
import { parseDuration } from "./duration.js";
import { defaultBase } from "./merged.js";
import { type Entry, scan } from "./scan.js";

export interface Context {
  cwd: string;
  args: string[];
  config: Config;
  flags: {
    base?: string;
    "older-than"?: string;
    json?: boolean;
    merged?: boolean;
    gone?: boolean;
    stale?: boolean;
    squash?: boolean;
    dryRun?: boolean;
    yes?: boolean;
    interactive?: boolean;
    noBackup?: boolean;
  };
}

export function scanRepo(ctx: Context): Entry[] {
  return scan(
    {
      base: ctx.flags.base ?? ctx.config.base ?? defaultBase(ctx.cwd),
      staleAfter: parseDuration(ctx.flags["older-than"] ?? ctx.config.sweep.olderThan),
      protected: ctx.config.protected,
      squash: ctx.flags.squash ?? ctx.config.squash,
    },
    ctx.cwd,
  );
}
