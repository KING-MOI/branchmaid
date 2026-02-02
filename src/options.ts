import { parseArgs } from "node:util";

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
  remotes: { type: "boolean", short: "r" },
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
} as const;

export function parseFlags(argv: string[]) {
  return parseArgs({ args: argv, allowPositionals: true, options: OPTIONS });
}

export type Flags = ReturnType<typeof parseFlags>["values"];
