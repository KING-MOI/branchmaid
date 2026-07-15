import pc from "picocolors";
import { listBackups } from "../backup.js";
import { resolveConfig } from "../config.js";
import type { Context } from "../context.js";
import { assertGitVersion, git, repoRoot } from "../git.js";
import { defaultBase } from "../merged.js";

type Status = "ok" | "warn" | "fail";

const ICON: Record<Status, string> = { ok: pc.green("✓"), warn: pc.yellow("!"), fail: pc.red("✗") };

function check(label: string, fn: () => [Status, string]): Status {
  let status: Status;
  let detail: string;
  try {
    [status, detail] = fn();
  } catch (err) {
    [status, detail] = ["fail", (err as Error).message];
  }
  console.log(`${ICON[status]} ${label}${detail ? pc.dim(` - ${detail}`) : ""}`);
  return status;
}

export function doctor(ctx: Context): number {
  const results = [
    check("git version", () => {
      assertGitVersion();
      return ["ok", git(["--version"])];
    }),
    check("repository", () => ["ok", repoRoot(ctx.cwd)]),
    check("config", () => ["ok", resolveConfig(repoRoot(ctx.cwd)).source ?? "defaults"]),
    check("base branch", () => ["ok", ctx.flags.base ?? ctx.config.base ?? defaultBase(ctx.cwd)]),
    check("origin HEAD", () => {
      const remotes = git(["remote"], ctx.cwd).split("\n");
      if (!remotes.includes("origin")) return ["ok", "no origin remote"];
      try {
        return ["ok", git(["symbolic-ref", "--short", "refs/remotes/origin/HEAD"], ctx.cwd)];
      } catch {
        return ["warn", "not set, run: git remote set-head origin --auto"];
      }
    }),
    check("fetch.prune", () => {
      let value = "";
      try {
        value = git(["config", "--get", "fetch.prune"], ctx.cwd);
      } catch {}
      return value === "true"
        ? ["ok", "enabled"]
        : [
            "warn",
            "gone branches only show up after a pruning fetch, use --fetch or git config fetch.prune true",
          ];
    }),
    check("backups", () => ["ok", `${listBackups(ctx.cwd).length} tag(s)`]),
  ];
  return results.includes("fail") ? 1 : 0;
}
