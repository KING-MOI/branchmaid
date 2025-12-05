import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface SweepConfig {
  olderThan: string;
  merged: boolean;
  gone: boolean;
}

export interface Config {
  base?: string;
  protected: string[];
  sweep: SweepConfig;
}

export const DEFAULTS: Config = {
  protected: ["main", "master", "develop"],
  sweep: { olderThan: "30d", merged: true, gone: true },
};

export function loadConfig(dir = process.cwd()): Config {
  const rc = join(dir, ".branchmaidrc");
  if (!existsSync(rc)) return DEFAULTS;
  const raw = JSON.parse(readFileSync(rc, "utf8"));
  return { ...DEFAULTS, ...raw, sweep: { ...DEFAULTS.sweep, ...raw.sweep } };
}
