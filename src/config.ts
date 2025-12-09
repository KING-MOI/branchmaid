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

function readJson(file: string): any {
  return JSON.parse(readFileSync(file, "utf8"));
}

function findRaw(dir: string): Partial<Config> | undefined {
  const rc = join(dir, ".branchmaidrc");
  if (existsSync(rc)) return readJson(rc);
  const pkg = join(dir, "package.json");
  if (existsSync(pkg)) return readJson(pkg).branchmaid;
  return undefined;
}

export function loadConfig(dir = process.cwd()): Config {
  const raw = findRaw(dir);
  if (!raw) return DEFAULTS;
  return { ...DEFAULTS, ...raw, sweep: { ...DEFAULTS.sweep, ...raw.sweep } };
}
