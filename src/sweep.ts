import type { SweepConfig } from "./config.js";
import type { Entry } from "./scan.js";

export function selectSweep(entries: Entry[], cfg: SweepConfig): Entry[] {
  return entries.filter((e) => {
    if (e.protected) return false;
    const atBase = e.ahead === 0 && e.behind === 0;
    if (cfg.merged && !atBase && (e.reasons.includes("merged") || e.reasons.includes("squashed")))
      return true;
    if (cfg.gone && e.reasons.includes("gone")) return true;
    if (cfg.stale && e.reasons.includes("stale")) return true;
    return false;
  });
}
