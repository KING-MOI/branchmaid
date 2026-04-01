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
