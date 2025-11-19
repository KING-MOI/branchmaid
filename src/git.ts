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
