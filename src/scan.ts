import { type Branch, listBranches } from "./branches.js";
import { classify, isProtected, type Reason } from "./classify.js";
import { aheadBehind, isSquashMerged, mergedInto } from "./merged.js";

export interface Entry {
  branch: Branch;
  reasons: Reason[];
  protected: boolean;
  age: number;
  ahead: number;
  behind: number;
}

export interface ScanOptions {
  base: string;
  staleAfter: number;
  protected: string[];
  squash?: boolean;
  now?: number;
}

export function scan(opts: ScanOptions, cwd?: string): Entry[] {
  const now = opts.now ?? Date.now();
  const branches = listBranches(cwd);
  const merged = mergedInto(opts.base, cwd);
  const squashed = new Set<string>();
  if (opts.squash) {
    for (const b of branches) {
      if (merged.has(b.name) || isProtected(b, opts.protected, opts.base)) continue;
      if (isSquashMerged(b.name, opts.base, cwd)) squashed.add(b.name);
    }
  }
  const counts = aheadBehind(opts.base, cwd);
  return branches.map((branch) => ({
    branch,
    reasons: classify(branch, { now, staleAfter: opts.staleAfter, merged, squashed }),
    protected: isProtected(branch, opts.protected, opts.base),
    age: now - branch.date.getTime(),
    ahead: counts.get(branch.name)?.ahead ?? 0,
    behind: counts.get(branch.name)?.behind ?? 0,
  }));
}
