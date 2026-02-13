import { confirm, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { type Context, scanRepo } from "../context.js";
import { deleteBranch } from "../delete.js";
import { pick } from "../pick.js";
import { renderEntries } from "../render.js";
import { selectSweep } from "../sweep.js";

export async function sweep(ctx: Context): Promise<number> {
  const entries = scanRepo(ctx);
  let targets = selectSweep(entries, ctx.config.sweep);
  if (ctx.flags.interactive) {
    const picked = await pick(
      entries.filter((e) => !e.protected),
      targets,
    );
    if (!picked) {
      console.log("aborted");
      return 0;
    }
    targets = picked;
  }
  if (targets.length === 0) {
    console.log("nothing to sweep");
    return 0;
  }
  console.log(renderEntries(targets));
  if (ctx.flags.dryRun) {
    console.log(pc.dim(`\ndry run: ${targets.length} branch(es) would be deleted`));
    return 0;
  }
  if (!ctx.flags.yes && !ctx.flags.interactive) {
    if (!process.stdin.isTTY) {
      console.error("refusing to delete without --yes (or use --dry-run)");
      return 1;
    }
    const ok = await confirm({ message: `Delete ${targets.length} branch(es)? Backups are kept as tags.` });
    if (isCancel(ok) || !ok) {
      console.log("aborted");
      return 0;
    }
  }
  let failed = 0;
  for (const e of targets) {
    const res = deleteBranch(e.branch, { cwd: ctx.cwd, backup: !ctx.flags.noBackup });
    if (res.deleted) {
      console.log(`${pc.green("deleted")} ${res.name}${res.tag ? pc.dim(` -> ${res.tag}`) : ""}`);
    } else {
      failed++;
      console.error(`${pc.red("failed")} ${res.name}: ${res.error}`);
    }
  }
  return failed ? 1 : 0;
}
