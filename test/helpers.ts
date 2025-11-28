import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function sh(cwd: string, args: string[], env: Record<string, string> = {}): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
  }).trim();
}

export function commit(dir: string, msg: string, date?: Date): void {
  const env = date
    ? { GIT_AUTHOR_DATE: date.toISOString(), GIT_COMMITTER_DATE: date.toISOString() }
    : {};
  sh(dir, ["commit", "-q", "--allow-empty", "-m", msg], env);
}

export function makeRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "branchmaid-"));
  sh(dir, ["init", "-q", "-b", "main"]);
  sh(dir, ["config", "user.name", "Test"]);
  sh(dir, ["config", "user.email", "test@example.com"]);
  sh(dir, ["config", "commit.gpgsign", "false"]);
  sh(dir, ["config", "tag.gpgsign", "false"]);
  sh(dir, ["config", "core.hooksPath", "/dev/null"]);
  commit(dir, "init");
  return dir;
}

export function addRemote(repo: string): string {
  const remote = mkdtempSync(join(tmpdir(), "branchmaid-remote-"));
  sh(remote, ["init", "-q", "--bare"]);
  sh(repo, ["remote", "add", "origin", remote]);
  sh(repo, ["push", "-q", "-u", "origin", "main"]);
  return remote;
}
