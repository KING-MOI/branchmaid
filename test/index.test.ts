import { describe, expect, it } from "vitest";
import * as api from "../src/index.js";
import { makeRepo, sh } from "./helpers.js";

describe("programmatic api", () => {
  it("scans and sweeps without the cli", () => {
    const repo = makeRepo();
    sh(repo, ["branch", "done"]);
    sh(repo, ["commit", "-q", "--allow-empty", "-m", "next"]);
    const entries = api.scan(
      { base: "main", staleAfter: api.parseDuration("30d"), protected: ["main"] },
      repo,
    );
    const targets = api.selectSweep(entries, api.DEFAULTS.sweep);
    expect(targets.map((e) => e.branch.name)).toEqual(["done"]);
    expect(api.deleteBranch(targets[0].branch, { cwd: repo }).deleted).toBe(true);
    expect(api.listBackups(repo)[0].branch).toBe("done");
  });
});
