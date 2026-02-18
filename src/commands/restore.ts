import pc from "picocolors";
import { listBackups, restoreBackup } from "../backup.js";
import type { Context } from "../context.js";

export function restore(ctx: Context): number {
  const [name] = ctx.args;
  if (!name) {
    console.error("usage: branchmaid restore <branch>");
    return 1;
  }
  const backup = listBackups(ctx.cwd).find((b) => b.branch === name);
  if (!backup) {
    console.error(`no backup found for ${name}`);
    return 1;
  }
  restoreBackup(backup, ctx.cwd);
  console.log(`${pc.green("restored")} ${name} at ${backup.sha.slice(0, 7)}`);
  return 0;
}
