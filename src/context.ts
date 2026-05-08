import type { Config } from "./config.js";
import { parseDuration } from "./duration.js";
import { assertGitVersion, git } from "./git.js";
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
    prune?: string;
    mine?: boolean;
    names?: boolean;
    sort?: string;
    limit?: string;
    fetch?: boolean;
    remote?: boolean;
    as?: string;
  };
}

export function scanRepo(ctx: Context): Entry[] {
  assertGitVersion();
  if (ctx.flags.fetch) git(["fetch", "--all", "--prune", "--quiet"], ctx.cwd);
  const entries = scan(
    {
      base: ctx.flags.base ?? ctx.config.base ?? defaultBase(ctx.cwd),
      staleAfter: parseDuration(ctx.flags["older-than"] ?? ctx.config.sweep.olderThan),
      protected: ctx.config.protected,
      squash: ctx.flags.squash ?? ctx.config.squash,
    },
    ctx.cwd,
  );
  if (!ctx.flags.mine) return entries;
  const email = git(["config", "user.email"], ctx.cwd);
  return entries.filter((e) => e.branch.email === email);
}
