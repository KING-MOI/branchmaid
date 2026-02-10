import { createBackup } from "./backup.js";
import type { Branch } from "./branches.js";
import { git } from "./git.js";

export interface DeleteOptions {
  dryRun?: boolean;
  backup?: boolean;
  cwd?: string;
}

export interface DeleteResult {
  name: string;
  tag?: string;
  deleted: boolean;
  error?: string;
}

export function deleteBranch(branch: Branch, opts: DeleteOptions = {}): DeleteResult {
  if (opts.dryRun) return { name: branch.name, deleted: false };
  let tag: string | undefined;
  try {
    if (opts.backup !== false) tag = createBackup(branch.name, branch.sha, opts.cwd);
    git(["branch", "-D", branch.name], opts.cwd);
    return { name: branch.name, tag, deleted: true };
  } catch (err) {
    if (tag) git(["tag", "-d", tag], opts.cwd);
    return { name: branch.name, deleted: false, error: (err as Error).message };
  }
}
