import { git } from "./git.js";

export function mergedInto(base: string, cwd?: string): Set<string> {
  try {
    git(["rev-parse", "--verify", "--quiet", `${base}^{commit}`], cwd);
  } catch {
    throw new Error(`base branch not found: ${base}`);
  }
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

export function isSquashMerged(branch: string, base: string, cwd?: string): boolean {
  const mergeBase = git(["merge-base", base, branch], cwd);
  const tree = git(["rev-parse", `${branch}^{tree}`], cwd);
  const probe = git(["commit-tree", tree, "-p", mergeBase, "-m", "branchmaid probe"], cwd);
  return git(["cherry", base, probe], cwd).startsWith("-");
}
