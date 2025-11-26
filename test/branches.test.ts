import { describe, expect, it } from "vitest";
import { listBranches } from "../src/branches.js";
import { commit, makeRepo, sh } from "./helpers.js";

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
