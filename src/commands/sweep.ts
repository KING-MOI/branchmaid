import pc from "picocolors";
import { type Context, scanRepo } from "../context.js";
import { deleteBranch } from "../delete.js";
import { renderEntries } from "../render.js";
import { selectSweep } from "../sweep.js";

export function sweep(ctx: Context): number {
  const targets = selectSweep(scanRepo(ctx), ctx.config.sweep);
  if (targets.length === 0) {
    console.log("nothing to sweep");
    return 0;
  }
  console.log(renderEntries(targets));
  if (ctx.flags.dryRun) {
    console.log(pc.dim(`\ndry run: ${targets.length} branch(es) would be deleted`));
    return 0;
  }
  if (!ctx.flags.yes) {
    console.error("refusing to delete without --yes (or use --dry-run)");
    return 1;
  }
  let failed = 0;
  for (const e of targets) {
    const res = deleteBranch(e.branch, { cwd: ctx.cwd });
    if (res.deleted) {
      console.log(`${pc.green("deleted")} ${res.name} ${pc.dim(`-> ${res.tag}`)}`);
    } else {
      failed++;
      console.error(`${pc.red("failed")} ${res.name}: ${res.error}`);
    }
  }
  return failed ? 1 : 0;
}
