import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { aheadBehind, defaultBase, isSquashMerged, mergedInto } from "../src/merged.js";
import { addRemote, commit, makeRepo, sh } from "./helpers.js";

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

describe("isSquashMerged unrelated history", () => {
  it("returns false for an orphan branch instead of throwing", () => {
    const repo = makeRepo();
    sh(repo, ["checkout", "-q", "--orphan", "gh-pages"]);
    commit(repo, "pages");
    sh(repo, ["checkout", "-q", "main"]);
    expect(isSquashMerged("gh-pages", "main", repo)).toBe(false);
  });
});

describe("isSquashMerged ambiguous names", () => {
  it("checks the branch even when a tag has the same name", () => {
    const repo = makeRepo();
    sh(repo, ["tag", "release"]);
    sh(repo, ["checkout", "-q", "-b", "release"]);
    writeFileSync(join(repo, "r.txt"), "r\n");
    sh(repo, ["add", "r.txt"]);
    commit(repo, "unmerged release work");
    sh(repo, ["checkout", "-q", "main"]);
    commit(repo, "main moves on");
    expect(isSquashMerged("release", "main", repo)).toBe(false);
  });
});

describe("defaultBase fallbacks", () => {
  it("uses origin HEAD when set", () => {
    const repo = makeRepo();
    addRemote(repo);
    sh(repo, ["branch", "-m", "main", "trunk"]);
    sh(repo, ["push", "-q", "origin", "trunk"]);
    sh(repo, ["remote", "set-head", "origin", "trunk"]);
    expect(defaultBase(repo)).toBe("trunk");
  });

  it("falls back to the remote branch when the local one was deleted", () => {
    const repo = makeRepo();
    addRemote(repo);
    sh(repo, ["remote", "set-head", "origin", "main"]);
    sh(repo, ["checkout", "-q", "-b", "work"]);
    sh(repo, ["branch", "-D", "main"]);
    expect(defaultBase(repo)).toBe("origin/main");
  });

  it("honours init.defaultBranch", () => {
    const repo = makeRepo();
    sh(repo, ["branch", "-m", "main", "trunk"]);
    sh(repo, ["config", "init.defaultBranch", "trunk"]);
    expect(defaultBase(repo)).toBe("trunk");
  });
});

describe("mergedInto remote refs", () => {
  it("reports remote branches merged into base", () => {
    const repo = makeRepo();
    addRemote(repo);
    sh(repo, ["push", "-q", "origin", "main:done"]);
    sh(repo, ["checkout", "-q", "-b", "open"]);
    commit(repo, "open work");
    sh(repo, ["push", "-q", "origin", "open"]);
    sh(repo, ["checkout", "-q", "main"]);
    sh(repo, ["fetch", "-q"]);
    const merged = mergedInto("main", repo, "refs/remotes/origin");
    expect(merged.has("origin/done")).toBe(true);
    expect(merged.has("origin/open")).toBe(false);
  });
});
