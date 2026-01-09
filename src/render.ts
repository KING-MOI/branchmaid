import pc from "picocolors";
import type { Reason } from "./classify.js";
import { formatAge } from "./duration.js";
import type { Entry } from "./scan.js";
import { table } from "./table.js";

const BADGE: Record<Reason, (s: string) => string> = {
  merged: pc.green,
  squashed: pc.green,
  gone: pc.yellow,
  stale: pc.red,
};

export function renderReasons(reasons: Reason[]): string {
  return reasons.map((r) => BADGE[r](r)).join(",");
}

export function renderEntries(entries: Entry[]): string {
  return table(
    entries.map((e) => [
      e.branch.current ? pc.cyan(`* ${e.branch.name}`) : `  ${e.branch.name}`,
      pc.dim(formatAge(e.age)),
      e.branch.author,
      renderReasons(e.reasons),
      pc.dim(e.branch.subject),
    ]),
  );
}
