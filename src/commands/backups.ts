import pc from "picocolors";
import { listBackups } from "../backup.js";
import type { Context } from "../context.js";
import { formatAge } from "../duration.js";
import { table } from "../table.js";

export function backups(ctx: Context): number {
  const all = listBackups(ctx.cwd);
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
    table(all.map((b) => [b.branch, pc.dim(formatAge(now - b.date.getTime())), pc.dim(b.sha.slice(0, 7)), pc.dim(b.tag)])),
  );
  return 0;
}
