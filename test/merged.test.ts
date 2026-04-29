import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { aheadBehind, defaultBase, isSquashMerged, mergedInto } from "../src/merged.js";
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

describe("isSquashMerged", () => {
  it("recognises a branch squashed into base", () => {
    const repo = makeRepo();
    sh(repo, ["checkout", "-q", "-b", "squashy"]);
    writeFileSync(join(repo, "a.txt"), "a\n");
    sh(repo, ["add", "a.txt"]);
    commit(repo, "add a");
    writeFileSync(join(repo, "b.txt"), "b\n");
    sh(repo, ["add", "b.txt"]);
    commit(repo, "add b");
    sh(repo, ["checkout", "-q", "main"]);
    sh(repo, ["merge", "-q", "--squash", "squashy"]);
    commit(repo, "squashed");

    expect(mergedInto("main", repo).has("squashy")).toBe(false);
    expect(isSquashMerged("squashy", "main", repo)).toBe(true);
  });

  it("does not flag unmerged work", () => {
    const repo = makeRepo();
    sh(repo, ["checkout", "-q", "-b", "open"]);
    writeFileSync(join(repo, "c.txt"), "c\n");
    sh(repo, ["add", "c.txt"]);
    commit(repo, "add c");
    sh(repo, ["checkout", "-q", "main"]);
    expect(isSquashMerged("open", "main", repo)).toBe(false);
  });
});

describe("aheadBehind", () => {
  it("counts commits relative to base", () => {
    const repo = makeRepo();
    sh(repo, ["checkout", "-q", "-b", "topic"]);
    commit(repo, "t1");
    commit(repo, "t2");
    sh(repo, ["checkout", "-q", "main"]);
    commit(repo, "m1");
    const map = aheadBehind("main", repo);
    expect(map.get("topic")).toEqual({ ahead: 2, behind: 1 });
    expect(map.get("main")).toEqual({ ahead: 0, behind: 0 });
  });
});
