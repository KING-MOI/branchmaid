import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULTS, loadConfig } from "../src/config.js";

function dir(files: Record<string, unknown>): string {
  const d = mkdtempSync(join(tmpdir(), "branchmaid-cfg-"));
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(d, name), typeof body === "string" ? body : JSON.stringify(body));
  }
  return d;
}

describe("loadConfig", () => {
  it("returns defaults with no config", () => {
    expect(loadConfig(dir({}))).toEqual(DEFAULTS);
  });

  it("merges .branchmaidrc over defaults", () => {
    const cfg = loadConfig(dir({ ".branchmaidrc": { base: "trunk", sweep: { olderThan: "90d" } } }));
    expect(cfg.base).toBe("trunk");
    expect(cfg.sweep).toEqual({ ...DEFAULTS.sweep, olderThan: "90d" });
    expect(cfg.protected).toEqual(DEFAULTS.protected);
  });
});
