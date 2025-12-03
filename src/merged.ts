import { git } from "./git.js";

export function mergedInto(base: string, cwd?: string): Set<string> {
  const out = git(["branch", "--merged", base, "--format=%(refname:short)"], cwd);
  return new Set(out ? out.split("\n") : []);
}

export function defaultBase(cwd?: string): string {
  try {
    return git(["symbolic-ref", "--short", "refs/remotes/origin/HEAD"], cwd).replace(/^origin\//, "");
  } catch {
    for (const name of ["main", "master"]) {
      try {
        git(["rev-parse", "--verify", "--quiet", `refs/heads/${name}`], cwd);
        return name;
      } catch {}
    }
  }
  throw new Error("could not detect base branch, pass --base");
}
