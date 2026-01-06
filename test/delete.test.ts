import { describe, expect, it } from "vitest";
import { listBackups } from "../src/backup.js";
import { listBranches } from "../src/branches.js";
import { deleteBranch } from "../src/delete.js";
import { commit, makeRepo, sh } from "./helpers.js";

function repoWith(name: string): string {
  const repo = makeRepo();
  sh(repo, ["checkout", "-q", "-b", name]);
  commit(repo, "work");
  sh(repo, ["checkout", "-q", "main"]);
  return repo;
}

const find = (repo: string, name: string) => listBranches(repo).find((b) => b.name === name)!;

describe("deleteBranch", () => {
  it("deletes and leaves a backup tag at the old tip", () => {
    const repo = repoWith("old");
    const b = find(repo, "old");
    const res = deleteBranch(b, { cwd: repo });
    expect(res.deleted).toBe(true);
    expect(find(repo, "old")).toBeUndefined();
    expect(listBackups(repo)[0]).toMatchObject({ branch: "old", sha: b.sha, tag: res.tag });
  });

  it("does nothing in dry run", () => {
    const repo = repoWith("old");
    const res = deleteBranch(find(repo, "old"), { cwd: repo, dryRun: true });
    expect(res.deleted).toBe(false);
    expect(find(repo, "old")).toBeDefined();
    expect(listBackups(repo)).toEqual([]);
  });

  it("can skip the backup", () => {
    const repo = repoWith("old");
    deleteBranch(find(repo, "old"), { cwd: repo, backup: false });
    expect(listBackups(repo)).toEqual([]);
  });

  it("reports git errors instead of throwing", () => {
    const repo = makeRepo();
    const res = deleteBranch(find(repo, "main"), { cwd: repo, backup: false });
    expect(res.deleted).toBe(false);
    expect(res.error).toMatch(/cannot delete|checked out|used by worktree/i);
  });
});
