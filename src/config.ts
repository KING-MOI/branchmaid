import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDuration } from "./duration.js";

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

const RC_FILES = [".branchmaidrc", ".branchmaidrc.json"];

function readJson(file: string): any {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(`could not parse ${file}: ${(err as Error).message}`);
  }
}

function findRaw(dir: string): { raw: any; source: string } | undefined {
  for (const name of RC_FILES) {
    const rc = join(dir, name);
    if (existsSync(rc)) return { raw: readJson(rc), source: rc };
  }
  const pkg = join(dir, "package.json");
  if (existsSync(pkg)) {
    const raw = readJson(pkg).branchmaid;
    if (raw !== undefined) return { raw, source: `${pkg}#branchmaid` };
  }
  return undefined;
}

export function validateConfig(raw: any, source: string): Partial<Config> {
  const fail = (msg: string): never => {
    throw new Error(`${source}: ${msg}`);
  };
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) fail("config must be an object");
  if (raw.base !== undefined && typeof raw.base !== "string") fail("base must be a string");
  if (
    raw.protected !== undefined &&
    !(Array.isArray(raw.protected) && raw.protected.every((p: unknown) => typeof p === "string"))
  ) {
    fail("protected must be an array of strings");
  }
  const sweep = raw.sweep ?? {};
  if (typeof sweep !== "object") fail("sweep must be an object");
  for (const key of ["merged", "gone"]) {
    if (sweep[key] !== undefined && typeof sweep[key] !== "boolean") fail(`sweep.${key} must be a boolean`);
  }
  if (sweep.olderThan !== undefined) {
    try {
      parseDuration(String(sweep.olderThan));
    } catch {
      fail(`sweep.olderThan is not a valid duration: ${sweep.olderThan}`);
    }
  }
  return raw;
}

export function loadConfig(dir = process.cwd()): Config {
  const found = findRaw(dir);
  if (!found) return DEFAULTS;
  const raw = validateConfig(found.raw, found.source);
  return { ...DEFAULTS, ...raw, sweep: { ...DEFAULTS.sweep, ...raw.sweep } };
}
