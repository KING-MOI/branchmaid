import { parseArgs } from "node:util";
import pc from "picocolors";
import { backups } from "./commands/backups.js";
import { makeCompletion } from "./commands/completion.js";
import { config } from "./commands/config.js";
import { init } from "./commands/init.js";
import { list } from "./commands/list.js";
import { restore } from "./commands/restore.js";
import { sweep } from "./commands/sweep.js";
import { undo } from "./commands/undo.js";
import { type Config, loadConfig } from "./config.js";
import { COMMAND_HELP, HELP } from "./help.js";
import type { Context } from "./context.js";
import { repoRoot } from "./git.js";
import { version } from "./version.js";

export const COMMANDS: Record<string, (ctx: Context) => number | Promise<number>> = {
  list,
  sweep,
  backups,
  restore,
  undo,
  init,
  config,
  completion: makeCompletion(
    () => Object.keys(COMMANDS),
    () => Object.keys(OPTIONS),
  ),
};

export const OPTIONS = {
  base: { type: "string" },
  "older-than": { type: "string" },
  json: { type: "boolean" },
  merged: { type: "boolean" },
  gone: { type: "boolean" },
  stale: { type: "boolean" },
  squash: { type: "boolean" },
  "dry-run": { type: "boolean", short: "n" },
  yes: { type: "boolean", short: "y" },
  interactive: { type: "boolean", short: "i" },
  "no-backup": { type: "boolean" },
  prune: { type: "string" },
  mine: { type: "boolean" },
  names: { type: "boolean" },
  sort: { type: "string" },
  limit: { type: "string" },
  fetch: { type: "boolean", short: "f" },
  remote: { type: "boolean" },
  as: { type: "string" },
  "no-color": { type: "boolean" },
  protect: { type: "string", multiple: true },
  author: { type: "string" },
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
} as const;

async function run(argv: string[], cwd: string): Promise<number> {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: OPTIONS });
  const name = positionals[0] ?? "list";
  if (values.version) {
    console.log(version());
    return 0;
  }
  if (values.help || name === "help") {
    const topic = name === "help" ? positionals[1] : positionals[0];
    console.log((topic && COMMAND_HELP[topic]) || HELP);
    return 0;
  }
  const command = COMMANDS[name];
  if (!command) {
    console.error(`unknown command: ${name}`);
    return 1;
  }
  let config: Config | undefined;
  return command({
    cwd,
    args: positionals.slice(1),
    flags: { ...values, dryRun: values["dry-run"], noBackup: values["no-backup"] },
    get config() {
      config ??= loadConfig(repoRoot(cwd));
      return config;
    },
  });
}

export async function main(argv: string[], cwd = process.cwd()): Promise<number> {
  try {
    return await run(argv, cwd);
  } catch (err) {
    console.error(`${pc.red("error")} ${(err as Error).message}`);
    return 1;
  }
}
