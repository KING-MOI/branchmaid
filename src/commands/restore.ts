import pc from "picocolors";
import { listBackups, restoreBackup } from "../backup.js";
import type { Context } from "../context.js";

export function restore(ctx: Context): number {
  const [name] = ctx.args;
  if (!name) {
    console.error("usage: branchmaid restore <branch>");
    return 1;
  }
  const backup = listBackups(ctx.cwd).find((b) => b.branch === name || b.tag === name);
  if (!backup) {
    console.error(`no backup found for ${name}`);
    return 1;
  }
  const target = ctx.flags.as ?? backup.branch;
  restoreBackup(backup, ctx.cwd, target);
  console.log(`${pc.green("restored")} ${target} at ${backup.sha.slice(0, 7)}`);
  return 0;
}
