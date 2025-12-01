import { git } from "./git.js";

export function mergedInto(base: string, cwd?: string): Set<string> {
  const out = git(["branch", "--merged", base, "--format=%(refname:short)"], cwd);
  return new Set(out ? out.split("\n") : []);
}
