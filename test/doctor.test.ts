import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { run } from "./cli.js";
import { addRemote, makeRepo, sh } from "./helpers.js";

describe("doctor", () => {
  it("passes in a healthy repo", async () => {
    const r = makeRepo();
    const { code, out } = await run(["doctor"], r);
    expect(code).toBe(0);
    expect(out).toMatch(/✓ base branch - main/);
    expect(out).toMatch(/✓ origin HEAD - no origin remote/);
  });

  it("warns about a missing origin HEAD and fetch.prune", async () => {
    const r = makeRepo();
    addRemote(r);
    sh(r, ["config", "fetch.prune", "false"]);
    const { code, out } = await run(["doctor"], r);
    expect(code).toBe(0);
    expect(out).toContain("git remote set-head origin --auto");
    expect(out).toMatch(/! fetch.prune/);
  });

  it("fails outside a repository", async () => {
    const { code, out } = await run(["doctor"], tmpdir());
    expect(code).toBe(1);
    expect(out).toMatch(/✗ repository/);
  });
});
