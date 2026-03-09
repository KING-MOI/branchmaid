import type { Branch } from "./branches.js";
import { matchesAny } from "./glob.js";

export type Reason = "merged" | "squashed" | "gone" | "stale";

export interface ClassifyContext {
  now: number;
  staleAfter: number;
  merged: Set<string>;
  squashed?: Set<string>;
}

export function classify(branch: Branch, ctx: ClassifyContext): Reason[] {
  const reasons: Reason[] = [];
  if (ctx.merged.has(branch.name)) reasons.push("merged");
  else if (ctx.squashed?.has(branch.name)) reasons.push("squashed");
  if (branch.gone) reasons.push("gone");
  if (ctx.now - branch.date.getTime() >= ctx.staleAfter) reasons.push("stale");
  return reasons;
}

export function isProtected(branch: Branch, patterns: string[], base: string): boolean {
  return branch.current || branch.worktree !== "" || branch.name === base || matchesAny(branch.name, patterns);
}
