import { describe, expect, it } from "vitest";
import { mergedInto } from "../src/merged.js";
import { commit, makeRepo, sh } from "./helpers.js";

describe("mergedInto", () => {
  it("includes merged branches and excludes unmerged ones", () => {
    const repo = makeRepo();
    sh(repo, ["checkout", "-q", "-b", "done"]);
    commit(repo, "done work");
    sh(repo, ["checkout", "-q", "main"]);
    sh(repo, ["merge", "-q", "--no-ff", "-m", "merge done", "done"]);
    sh(repo, ["checkout", "-q", "-b", "wip"]);
    commit(repo, "wip work");
    sh(repo, ["checkout", "-q", "main"]);

    const merged = mergedInto("main", repo);
    expect(merged.has("done")).toBe(true);
    expect(merged.has("wip")).toBe(false);
  });
});
