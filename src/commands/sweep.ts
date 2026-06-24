import { confirm, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { type Context, scanRepo } from "../context.js";
import { deleteBranch } from "../delete.js";
import { pick } from "../pick.js";
import { renderEntries } from "../render.js";
import { selectSweep } from "../sweep.js";

export async function sweep(ctx: Context): Promise<number> {
  const entries = scanRepo(ctx);
  const { merged, gone, stale } = ctx.flags;
  const cfg =
    merged || gone || stale
      ? { ...ctx.config.sweep, merged: !!merged, gone: !!gone, stale: !!stale }
      : ctx.config.sweep;
  let targets = selectSweep(entries, cfg);
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
  const json = ctx.flags.json;
  if (targets.length === 0) {
    console.log(json ? "[]" : "nothing to sweep");
    return 0;
  }
  if (json && ctx.flags.dryRun) {
    console.log(JSON.stringify(targets, null, 2));
    return 0;
  }
  if (!json) console.log(renderEntries(targets));
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
  const at = new Date();
  const results = targets.map((e) =>
    deleteBranch(e.branch, { cwd: ctx.cwd, backup: !ctx.flags.noBackup, remote: ctx.flags.remote, at }),
  );
  const failed = results.filter((r) => !r.deleted).length;
  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return failed ? 1 : 0;
  }
  for (const [i, res] of results.entries()) {
    const e = targets[i];
    if (res.deleted) {
      console.log(`${pc.green("deleted")} ${res.name}${res.tag ? pc.dim(` -> ${res.tag}`) : ""}`);
      if (res.remoteDeleted) console.log(`${pc.green("deleted")} ${e.branch.upstream}`);
      if (res.remoteDeleted === false)
        console.error(`${pc.yellow("kept")} ${e.branch.upstream}: ${res.error}`);
    } else {
      console.error(`${pc.red("failed")} ${res.name}: ${res.error}`);
    }
  }
  const deleted = targets.length - failed;
  console.log(pc.dim(`\n${deleted} deleted, ${failed} failed`));
  if (deleted && !ctx.flags.noBackup) {
    console.log(pc.dim("undo with: branchmaid restore <branch>"));
  }
  return failed ? 1 : 0;
}
