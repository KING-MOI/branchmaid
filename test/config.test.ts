import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULTS, loadConfig, validateConfig } from "../src/config.js";

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

describe("loadConfig package.json", () => {
  it("reads the branchmaid key", () => {
    const cfg = loadConfig(dir({ "package.json": { name: "x", branchmaid: { protected: ["release/*"] } } }));
    expect(cfg.protected).toEqual(["release/*"]);
  });

  it("ignores package.json without the key", () => {
    expect(loadConfig(dir({ "package.json": { name: "x" } }))).toEqual(DEFAULTS);
  });

  it("prefers .branchmaidrc over package.json", () => {
    const cfg = loadConfig(
      dir({ ".branchmaidrc": { base: "a" }, "package.json": { branchmaid: { base: "b" } } }),
    );
    expect(cfg.base).toBe("a");
  });
});

describe("loadConfig rc variants", () => {
  it("reads .branchmaidrc.json", () => {
    expect(loadConfig(dir({ ".branchmaidrc.json": { base: "dev" } })).base).toBe("dev");
  });
});

describe("loadConfig errors", () => {
  it("reports which file failed to parse", () => {
    expect(() => loadConfig(dir({ ".branchmaidrc": "{ nope" }))).toThrow(/\.branchmaidrc/);
  });
});

describe("validateConfig", () => {
  it.each([
    [[], /must be an object/],
    [{ base: 1 }, /base must be a string/],
    [{ protected: "main" }, /protected must be an array/],
    [{ protected: [1] }, /protected must be an array/],
    [{ sweep: { merged: "yes" } }, /sweep.merged must be a boolean/],
    [{ sweep: { olderThan: "forever" } }, /not a valid duration/],
  ])("rejects %j", (raw, msg) => {
    expect(() => validateConfig(raw, "rc")).toThrow(msg);
  });

  it("prefixes errors with the source", () => {
    expect(() => loadConfig(dir({ ".branchmaidrc": { base: 3 } }))).toThrow(/\.branchmaidrc: base/);
  });
});

describe("validateConfig squash", () => {
  it("requires a boolean", () => {
    expect(() => validateConfig({ squash: "yes" }, "rc")).toThrow(/squash must be a boolean/);
  });
});

describe("validateConfig dates", () => {
  it("accepts an iso date for sweep.olderThan", () => {
    expect(() => validateConfig({ sweep: { olderThan: "2020-01-01" } }, "rc")).not.toThrow();
  });
});

describe("validateConfig unknown keys", () => {
  it("rejects typos at the top level", () => {
    expect(() => validateConfig({ protect: ["main"] }, "rc")).toThrow(/unknown option "protect"/);
  });

  it("rejects typos inside sweep", () => {
    expect(() => validateConfig({ sweep: { olderthan: "1d" } }, "rc")).toThrow(
      /unknown option "sweep.olderthan"/,
    );
  });

  it("allows a $schema reference", () => {
    expect(() => validateConfig({ $schema: "./node_modules/branchmaid/schema.json" }, "rc")).not.toThrow();
  });
});

describe("loadConfig $schema", () => {
  it("does not leak $schema into the config", () => {
    const cfg = loadConfig(dir({ ".branchmaidrc": { $schema: "x", base: "dev" } }));
    expect(cfg).not.toHaveProperty("$schema");
    expect(cfg.base).toBe("dev");
  });
});
