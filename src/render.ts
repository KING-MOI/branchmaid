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

export function renderEntries(entries: Entry[], maxWidth = process.stdout.columns || Infinity): string {
  return table(
    entries.map((e) => [
      e.branch.current ? pc.cyan(`* ${e.branch.name}`) : `  ${e.branch.name}`,
      pc.dim(formatAge(e.age)),
      e.protected ? "" : `${pc.green(`+${e.ahead}`)} ${pc.red(`-${e.behind}`)}`,
      e.branch.author,
      e.protected ? pc.dim("protected") : renderReasons(e.reasons),
      pc.dim(e.branch.subject),
    ]),
    maxWidth,
  );
}

export function summarize(entries: Entry[]): string {
  const counts: Record<string, number> = {};
  for (const e of entries) {
    if (e.protected) continue;
    for (const r of e.reasons) counts[r] = (counts[r] ?? 0) + 1;
  }
  const parts = [`${entries.length} branch${entries.length === 1 ? "" : "es"}`];
  for (const r of ["merged", "squashed", "gone", "stale"] as const) {
    if (counts[r]) parts.push(`${counts[r]} ${r}`);
  }
  return parts.join(" · ");
}
