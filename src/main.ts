import { parseArgs } from "node:util";
import pc from "picocolors";
import { list } from "./commands/list.js";
import { loadConfig } from "./config.js";
import type { Context } from "./context.js";
import { parseDuration } from "./duration.js";
import { repoRoot } from "./git.js";
import { defaultBase } from "./merged.js";

const COMMANDS: Record<string, (ctx: Context) => number> = { list };

const OPTIONS = {
  base: { type: "string" },
  "older-than": { type: "string" },
  json: { type: "boolean" },
  merged: { type: "boolean" },
  gone: { type: "boolean" },
  stale: { type: "boolean" },
  squash: { type: "boolean" },
} as const;

function run(argv: string[], cwd: string): number {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: OPTIONS });
  const name = positionals[0] ?? "list";
  const command = COMMANDS[name];
  if (!command) {
    console.error(`unknown command: ${name}`);
    return 1;
  }
  const config = loadConfig(repoRoot(cwd));
  return command({
    cwd,
    flags: values,
    config,
    base: values.base ?? config.base ?? defaultBase(cwd),
    staleAfter: parseDuration(values["older-than"] ?? config.sweep.olderThan),
  });
}

export function main(argv: string[], cwd = process.cwd()): number {
  try {
    return run(argv, cwd);
  } catch (err) {
    console.error(`${pc.red("error")} ${(err as Error).message}`);
    return 1;
  }
}
