import { describe, expect, it } from "vitest";
import { listBranches } from "../src/branches.js";
import { addRemote, commit, makeRepo, sh } from "./helpers.js";

describe("listBranches", () => {
  it("lists local branches with commit dates", () => {
    const repo = makeRepo();
    const old = new Date("2024-01-02T00:00:00Z");
    sh(repo, ["checkout", "-q", "-b", "feature/old"]);
    commit(repo, "old work", old);
    sh(repo, ["checkout", "-q", "main"]);

    const branches = listBranches(repo);
    expect(branches.map((b) => b.name).sort()).toEqual(["feature/old", "main"]);
    expect(branches.find((b) => b.name === "feature/old")?.date).toEqual(old);
  });
});

describe("listBranches details", () => {
  it("captures author and subject", () => {
    const repo = makeRepo();
    commit(repo, "add the thing");
    const [main] = listBranches(repo);
    expect(main.author).toBe("Test");
    expect(main.subject).toBe("add the thing");
  });
});

describe("listBranches current", () => {
  it("flags the checked out branch", () => {
    const repo = makeRepo();
    sh(repo, ["branch", "other"]);
    const branches = listBranches(repo);
    expect(branches.find((b) => b.current)?.name).toBe("main");
    expect(branches.find((b) => b.name === "other")?.current).toBe(false);
    expect(branches[0].email).toBe("test@example.com");
  });
});

describe("listBranches upstream", () => {
  it("marks branches whose remote was deleted as gone", () => {
    const repo = makeRepo();
    addRemote(repo);
    sh(repo, ["checkout", "-q", "-b", "shipped"]);
    commit(repo, "ship it");
    sh(repo, ["push", "-q", "-u", "origin", "shipped"]);
    sh(repo, ["checkout", "-q", "main"]);
    sh(repo, ["push", "-q", "origin", "--delete", "shipped"]);
    sh(repo, ["fetch", "-q", "--prune"]);

    const shipped = listBranches(repo).find((b) => b.name === "shipped");
    expect(shipped?.upstream).toBe("origin/shipped");
    expect(shipped?.gone).toBe(true);
    expect(listBranches(repo).find((b) => b.name === "main")?.gone).toBe(false);
  });
});
