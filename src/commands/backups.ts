import pc from "picocolors";
import { backupsOlderThan, dropBackup, listBackups } from "../backup.js";
import type { Context } from "../context.js";
import { formatAge, parseCutoff } from "../duration.js";
import { table } from "../table.js";

export function backups(ctx: Context): number {
  const all = listBackups(ctx.cwd);
  if (ctx.flags.prune) {
    const old = backupsOlderThan(all, parseCutoff(ctx.flags.prune));
    for (const b of old) {
      if (!ctx.flags.dryRun) dropBackup(b, ctx.cwd);
      console.log(`${ctx.flags.dryRun ? "would drop" : pc.yellow("dropped")} ${b.tag}`);
    }
    console.log(pc.dim(`${old.length} backup(s) ${ctx.flags.dryRun ? "would be " : ""}removed`));
    return 0;
  }
  if (ctx.flags.json) {
    console.log(JSON.stringify(all, null, 2));
    return 0;
  }
  if (all.length === 0) {
    console.log("no backups");
    return 0;
  }
  const now = Date.now();
  console.log(
    table(
      all.map((b) => [
        b.branch,
        pc.dim(formatAge(now - b.date.getTime())),
        pc.dim(b.sha.slice(0, 7)),
        pc.dim(b.tag),
      ]),
    ),
  );
  return 0;
}
