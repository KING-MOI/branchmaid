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

function tryGit(args: string[], cwd?: string): string | undefined {
  try {
    return git(args, cwd) || undefined;
  } catch {
    return undefined;
  }
}

export function defaultBase(cwd?: string): string {
  const remoteHead = tryGit(["symbolic-ref", "--short", "refs/remotes/origin/HEAD"], cwd)?.replace(
    /^origin\//,
    "",
  );
  const configured = tryGit(["config", "init.defaultBranch"], cwd);
  for (const name of [remoteHead, configured, "main", "master"]) {
    if (name && tryGit(["rev-parse", "--verify", "--quiet", `refs/heads/${name}`], cwd)) return name;
  }
  if (remoteHead && tryGit(["rev-parse", "--verify", "--quiet", `refs/remotes/origin/${remoteHead}`], cwd)) {
    return `origin/${remoteHead}`;
  }
  throw new Error("could not detect base branch, pass --base");
}

export function isSquashMerged(branch: string, base: string, cwd?: string): boolean {
  const ref = `refs/heads/${branch}`;
  let mergeBase: string;
  try {
    mergeBase = git(["merge-base", base, ref], cwd);
  } catch {
    return false;
  }
  const tree = git(["rev-parse", `${ref}^{tree}`], cwd);
  const probe = git(["commit-tree", tree, "-p", mergeBase, "-m", "branchmaid probe"], cwd);
  return git(["cherry", base, probe], cwd).startsWith("-");
}

export function aheadBehind(base: string, cwd?: string): Map<string, { ahead: number; behind: number }> {
  const out = git(["for-each-ref", `--format=%(refname:short) %(ahead-behind:${base})`, "refs/heads"], cwd);
  const map = new Map<string, { ahead: number; behind: number }>();
  for (const line of out ? out.split("\n") : []) {
    const [name, ahead, behind] = line.split(" ");
    map.set(name, { ahead: Number(ahead), behind: Number(behind) });
  }
  return map;
}
