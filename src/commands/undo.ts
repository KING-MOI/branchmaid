import pc from "picocolors";
import { lastBatch, listBackups, restoreBackup } from "../backup.js";
import type { Context } from "../context.js";

export function undo(ctx: Context): number {
  const batch = lastBatch(listBackups(ctx.cwd));
  if (batch.length === 0) {
    console.log("nothing to undo");
    return 0;
  }
  let failed = 0;
  for (const b of batch) {
    if (ctx.flags.dryRun) {
      console.log(`would restore ${b.branch}`);
      continue;
    }
    try {
      restoreBackup(b, ctx.cwd);
      console.log(`${pc.green("restored")} ${b.branch} at ${b.sha.slice(0, 7)}`);
    } catch (err) {
      failed++;
      console.error(`${pc.red("failed")} ${b.branch}: ${(err as Error).message}`);
    }
  }
  return failed ? 1 : 0;
}
