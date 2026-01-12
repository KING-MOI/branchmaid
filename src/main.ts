import { parseArgs } from "node:util";
import { loadConfig } from "./config.js";
import { parseDuration } from "./duration.js";
import { defaultBase } from "./merged.js";
import { renderEntries } from "./render.js";
import { scan } from "./scan.js";

export function main(argv: string[], cwd = process.cwd()): number {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      base: { type: "string" },
      "older-than": { type: "string" },
    },
  });
  const command = positionals[0] ?? "list";
  const config = loadConfig(cwd);
  const base = values.base ?? config.base ?? defaultBase(cwd);
  const staleAfter = parseDuration(values["older-than"] ?? config.sweep.olderThan);

  if (command === "list") {
    const entries = scan({ base, staleAfter, protected: config.protected }, cwd);
    console.log(renderEntries(entries));
    return 0;
  }

  console.error(`unknown command: ${command}`);
  return 1;
}
