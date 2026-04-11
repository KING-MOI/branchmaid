import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULTS } from "../src/config.js";
import { run } from "./cli.js";
import { makeRepo } from "./helpers.js";

describe("init", () => {
  it("writes the defaults to the repo root", async () => {
    const r = makeRepo();
    const { code } = await run(["init"], r);
    expect(code).toBe(0);
    expect(JSON.parse(readFileSync(join(r, ".branchmaidrc"), "utf8"))).toEqual(DEFAULTS);
  });

  it("refuses to overwrite", async () => {
    const r = makeRepo();
    writeFileSync(join(r, ".branchmaidrc"), "{}");
    const { code, err } = await run(["init"], r);
    expect(code).toBe(1);
    expect(err).toContain("already exists");
    expect(readFileSync(join(r, ".branchmaidrc"), "utf8")).toBe("{}");
  });
});

describe("config", () => {
  it("prints defaults when nothing is configured", async () => {
    const { out, err } = await run(["config"], makeRepo());
    expect(JSON.parse(out)).toEqual(DEFAULTS);
    expect(err).toContain("source: defaults");
  });

  it("names the file it loaded", async () => {
    const r = makeRepo();
    writeFileSync(join(r, ".branchmaidrc"), JSON.stringify({ base: "dev" }));
    const { out, err } = await run(["config"], r);
    expect(JSON.parse(out).base).toBe("dev");
    expect(err).toContain(".branchmaidrc");
  });
});
