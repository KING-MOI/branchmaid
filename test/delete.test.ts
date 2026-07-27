import { describe, expect, it } from "vitest";
import { listBackups } from "../src/backup.js";
import { listBranches, listRemoteBranches } from "../src/branches.js";
import { deleteBranch, deleteRemoteBranch } from "../src/delete.js";
import { addRemote, commit, makeRepo, sh } from "./helpers.js";

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

describe("deleteBranch failure cleanup", () => {
  it("does not leave a backup tag behind when deletion fails", () => {
    const repo = makeRepo();
    const res = deleteBranch(find(repo, "main"), { cwd: repo });
    expect(res.deleted).toBe(false);
    expect(listBackups(repo)).toEqual([]);
  });
});

describe("deleteBranch moved tip", () => {
  it("skips a branch that gained commits after it was scanned", () => {
    const repo = repoWith("busy");
    const scanned = find(repo, "busy");
    sh(repo, ["checkout", "-q", "busy"]);
    commit(repo, "late work");
    sh(repo, ["checkout", "-q", "main"]);

    const res = deleteBranch(scanned, { cwd: repo });
    expect(res.deleted).toBe(false);
    expect(res.error).toMatch(/moved/);
    expect(find(repo, "busy")).toBeDefined();
    expect(listBackups(repo)).toEqual([]);
  });
});

describe("deleteBranch remote safety", () => {
  it("keeps a remote branch that has commits the backup does not", () => {
    const repo = makeRepo();
    const remote = addRemote(repo);
    sh(repo, ["checkout", "-q", "-b", "shared"]);
    commit(repo, "mine");
    sh(repo, ["push", "-q", "-u", "origin", "shared"]);
    const other = `${remote}-clone`;
    sh(repo, ["clone", "-q", remote, other]);
    sh(other, ["checkout", "-q", "shared"]);
    sh(other, ["-c", "user.name=O", "-c", "user.email=o@x", "commit", "-q", "--allow-empty", "-m", "theirs"]);
    sh(other, ["push", "-q", "origin", "shared"]);
    sh(repo, ["checkout", "-q", "main"]);

    const res = deleteBranch(find(repo, "shared"), { cwd: repo, remote: true });
    expect(res.deleted).toBe(true);
    expect(res.remoteDeleted).toBe(false);
    expect(sh(remote, ["branch", "--list", "shared"])).toContain("shared");
  });
});

describe("deleteRemoteBranch", () => {
  function withRemoteBranch() {
    const repo = makeRepo();
    const remote = addRemote(repo);
    sh(repo, ["push", "-q", "origin", "main:feat/x"]);
    sh(repo, ["fetch", "-q"]);
    const b = listRemoteBranches("origin", repo).find((x) => x.name === "origin/feat/x")!;
    return { repo, remote, b };
  }

  it("deletes on the remote and tags the tip locally", () => {
    const { repo, remote, b } = withRemoteBranch();
    const res = deleteRemoteBranch(b, { cwd: repo });
    expect(res.deleted).toBe(true);
    expect(sh(remote, ["branch", "--list", "feat/x"])).toBe("");
    expect(listBackups(repo)[0]).toMatchObject({ branch: "feat/x", sha: b.sha });
  });

  it("refuses when the remote moved and drops the tag", () => {
    const { repo, remote, b } = withRemoteBranch();
    const ident = {
      GIT_AUTHOR_NAME: "O",
      GIT_AUTHOR_EMAIL: "o@x",
      GIT_COMMITTER_NAME: "O",
      GIT_COMMITTER_EMAIL: "o@x",
    };
    const moved = sh(remote, ["commit-tree", "-m", "x", "-p", b.sha, `${b.sha}^{tree}`], ident);
    sh(remote, ["update-ref", "refs/heads/feat/x", moved]);
    const res = deleteRemoteBranch(b, { cwd: repo });
    expect(res.deleted).toBe(false);
    expect(listBackups(repo)).toEqual([]);
  });
});
