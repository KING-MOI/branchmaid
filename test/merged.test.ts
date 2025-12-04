import { describe, expect, it } from "vitest";
import { defaultBase, mergedInto } from "../src/merged.js";
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

describe("defaultBase", () => {
  it("falls back to main when there is no origin HEAD", () => {
    expect(defaultBase(makeRepo())).toBe("main");
  });

  it("falls back to master", () => {
    const repo = makeRepo();
    sh(repo, ["branch", "-m", "main", "master"]);
    expect(defaultBase(repo)).toBe("master");
  });

  it("throws when nothing matches", () => {
    const repo = makeRepo();
    sh(repo, ["branch", "-m", "main", "trunk"]);
    expect(() => defaultBase(repo)).toThrow(/base branch/);
  });
});
