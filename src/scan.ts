import { type Branch, listBranches, listRemoteBranches } from "./branches.js";
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
  remote?: string;
}

export function scan(opts: ScanOptions, cwd?: string): Entry[] {
  const now = opts.now ?? Date.now();
  const remote = opts.remote;
  const pattern = remote ? `refs/remotes/${remote}` : "refs/heads";
  const branches = remote ? listRemoteBranches(remote, cwd) : listBranches(cwd);
  const strip = (name: string) =>
    remote && name.startsWith(`${remote}/`) ? name.slice(remote.length + 1) : name;
  const guarded = (b: Branch) =>
    b.name === opts.base || isProtected({ ...b, name: strip(b.name) }, opts.protected, strip(opts.base));
  const merged = mergedInto(opts.base, cwd, pattern);
  const squashed = new Set<string>();
  if (opts.squash) {
    for (const b of branches) {
      if (merged.has(b.name) || guarded(b)) continue;
      const ref = remote ? `refs/remotes/${b.name}` : `refs/heads/${b.name}`;
      if (isSquashMerged(ref, opts.base, cwd)) squashed.add(b.name);
    }
  }
  const counts = aheadBehind(opts.base, cwd, pattern);
  return branches.map((branch) => ({
    branch,
    reasons: classify(branch, { now, staleAfter: opts.staleAfter, merged, squashed }),
    protected: guarded(branch),
    age: now - branch.date.getTime(),
    ahead: counts.get(branch.name)?.ahead ?? 0,
    behind: counts.get(branch.name)?.behind ?? 0,
  }));
}
