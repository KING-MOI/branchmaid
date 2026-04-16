import { isCancel, select } from "@clack/prompts";
import pc from "picocolors";
import { type Backup, listBackups, restoreBackup } from "../backup.js";
import type { Context } from "../context.js";
import { formatAge } from "../duration.js";

async function choose(all: Backup[]): Promise<Backup | undefined> {
  const now = Date.now();
  const tag = await select({
    message: "Restore which backup?",
    options: all.map((b) => ({
      value: b.tag,
      label: b.branch,
      hint: `${formatAge(now - b.date.getTime())} ago · ${b.sha.slice(0, 7)}`,
    })),
  });
  if (isCancel(tag)) return undefined;
  return all.find((b) => b.tag === tag);
}

export async function restore(ctx: Context): Promise<number> {
  const [name] = ctx.args;
  const all = listBackups(ctx.cwd);
  let backup: Backup | undefined;
  if (name) {
    backup = all.find((b) => b.branch === name || b.tag === name);
    if (!backup) {
      console.error(`no backup found for ${name}`);
      return 1;
    }
  } else {
    if (!process.stdin.isTTY) {
      console.error("usage: branchmaid restore <branch>");
      return 1;
    }
    if (all.length === 0) {
      console.log("no backups");
      return 0;
    }
    backup = await choose(all);
    if (!backup) {
      console.log("aborted");
      return 0;
    }
  }
  const target = ctx.flags.as ?? backup.branch;
  restoreBackup(backup, ctx.cwd, target);
  console.log(`${pc.green("restored")} ${target} at ${backup.sha.slice(0, 7)}`);
  return 0;
}
