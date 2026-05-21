import { execFileSync } from "node:child_process";

export class GitError extends Error {
  constructor(
    message: string,
    readonly args: string[],
  ) {
    super(message);
    this.name = "GitError";
  }
}

export function git(args: string[], cwd = process.cwd()): string {
  if (process.env.BRANCHMAID_DEBUG) console.error(`$ git ${args.join(" ")}`);
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trimEnd();
  } catch (err) {
    const e = err as { stderr?: string; message: string };
    throw new GitError(String(e.stderr ?? "").trim() || e.message, args);
  }
}

export function repoRoot(cwd?: string): string {
  return git(["rev-parse", "--show-toplevel"], cwd);
}

export const MIN_GIT = [2, 41] as const;

export function parseGitVersion(out: string): [number, number] | undefined {
  const m = /git version (\d+)\.(\d+)/.exec(out);
  return m ? [Number(m[1]), Number(m[2])] : undefined;
}

export function assertGitVersion(out = git(["--version"])): void {
  const v = parseGitVersion(out);
  if (!v) return;
  if (v[0] < MIN_GIT[0] || (v[0] === MIN_GIT[0] && v[1] < MIN_GIT[1])) {
    throw new Error(`git ${MIN_GIT.join(".")} or newer is required (found ${v.join(".")})`);
  }
}
