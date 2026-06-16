import type { Config } from "./config.js";
import { parseCutoff } from "./duration.js";
import { assertGitVersion, git, repoRoot } from "./git.js";
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
    protect?: string[];
    author?: string;
  };
}

export function scanRepo(ctx: Context): Entry[] {
  assertGitVersion();
  repoRoot(ctx.cwd);
  try {
    git(["rev-parse", "--verify", "--quiet", "HEAD"], ctx.cwd);
  } catch {
    throw new Error("this repository has no commits yet");
  }
  if (ctx.flags.fetch) git(["fetch", "--all", "--prune", "--quiet"], ctx.cwd);
  const entries = scan(
    {
      base: ctx.flags.base ?? ctx.config.base ?? defaultBase(ctx.cwd),
      staleAfter: parseCutoff(ctx.flags["older-than"] ?? ctx.config.sweep.olderThan),
      protected: [...ctx.config.protected, ...(ctx.flags.protect ?? [])],
      squash: ctx.flags.squash ?? ctx.config.squash,
    },
    ctx.cwd,
  );
  let result = entries;
  if (ctx.flags.mine) {
    const email = git(["config", "user.email"], ctx.cwd);
    result = result.filter((e) => e.branch.email === email);
  }
  if (ctx.flags.author) {
    const needle = ctx.flags.author.toLowerCase();
    result = result.filter((e) => `${e.branch.author} ${e.branch.email}`.toLowerCase().includes(needle));
  }
  return result;
}
