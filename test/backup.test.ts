import { describe, expect, it } from "vitest";
import {
  backupsOlderThan,
  backupTagName,
  createBackup,
  dropBackup,
  lastBatch,
  listBackups,
  parseBackupTag,
  restoreBackup,
} from "../src/backup.js";
import { makeRepo, sh } from "./helpers.js";

const at = new Date("2026-02-03T04:05:06.789Z");

describe("backupTagName", () => {
  it("puts the timestamp before the branch name", () => {
    expect(backupTagName("feature/x", at)).toBe("branchmaid/backup/20260203T040506Z/feature/x");
  });
});

describe("createBackup", () => {
  it("tags the branch tip", () => {
    const repo = makeRepo();
    const sha = sh(repo, ["rev-parse", "HEAD"]);
    const tag = createBackup("main", sha, repo, at);
    expect(sh(repo, ["rev-parse", `${tag}^{commit}`])).toBe(sha);
  });
});

describe("parseBackupTag", () => {
  it("round-trips names with slashes", () => {
    expect(parseBackupTag(backupTagName("a/b/c", at))).toEqual({
      branch: "a/b/c",
      date: new Date("2026-02-03T04:05:06Z"),
    });
  });

  it("rejects foreign tags", () => {
    expect(parseBackupTag("v1.0.0")).toBeUndefined();
    expect(parseBackupTag("branchmaid/backup/notastamp/x")).toBeUndefined();
    expect(parseBackupTag("branchmaid/backup/20260203T040506Z")).toBeUndefined();
  });
});

describe("listBackups", () => {
  it("returns newest first", () => {
    const repo = makeRepo();
    const sha = sh(repo, ["rev-parse", "HEAD"]);
    createBackup("old", sha, repo, new Date("2026-01-01T00:00:00Z"));
    createBackup("new", sha, repo, new Date("2026-02-01T00:00:00Z"));
    sh(repo, ["tag", "v1.0.0"]);
    expect(listBackups(repo).map((b) => b.branch)).toEqual(["new", "old"]);
  });
});

describe("restoreBackup", () => {
  it("recreates the branch at the tagged commit", () => {
    const repo = makeRepo();
    const sha = sh(repo, ["rev-parse", "HEAD"]);
    createBackup("gone-branch", sha, repo);
    const [backup] = listBackups(repo);
    restoreBackup(backup, repo);
    expect(sh(repo, ["rev-parse", "gone-branch"])).toBe(sha);
  });

  it("refuses to clobber an existing branch", () => {
    const repo = makeRepo();
    const sha = sh(repo, ["rev-parse", "HEAD"]);
    createBackup("main", sha, repo);
    expect(() => restoreBackup(listBackups(repo)[0], repo)).toThrow(/already exists/);
  });
});

describe("dropBackup", () => {
  it("deletes the tag", () => {
    const repo = makeRepo();
    createBackup("x", sh(repo, ["rev-parse", "HEAD"]), repo);
    dropBackup(listBackups(repo)[0], repo);
    expect(listBackups(repo)).toEqual([]);
  });
});

describe("backupsOlderThan", () => {
  it("keeps only backups past the cutoff", () => {
    const now = new Date("2026-03-01T00:00:00Z").getTime();
    const mk = (branch: string, iso: string) => ({ tag: branch, branch, sha: "x", date: new Date(iso) });
    const all = [mk("new", "2026-02-25T00:00:00Z"), mk("old", "2025-12-01T00:00:00Z")];
    expect(backupsOlderThan(all, 30 * 86_400_000, now).map((b) => b.branch)).toEqual(["old"]);
  });
});

describe("createBackup collisions", () => {
  it("does not fail when the same branch is backed up twice in one second", () => {
    const repo = makeRepo();
    const sha = sh(repo, ["rev-parse", "HEAD"]);
    const first = createBackup("x", sha, repo, at);
    const second = createBackup("x", sha, repo, at);
    expect(second).not.toBe(first);
    expect(listBackups(repo).map((b) => b.branch)).toEqual(["x", "x"]);
  });
});

describe("lastBatch", () => {
  it("returns every backup sharing the newest timestamp", () => {
    const mk = (branch: string, iso: string) => ({ tag: branch, branch, sha: "x", date: new Date(iso) });
    const all = [
      mk("a", "2026-02-01T00:00:00Z"),
      mk("b", "2026-02-01T00:00:00Z"),
      mk("old", "2026-01-01T00:00:00Z"),
    ];
    expect(lastBatch(all).map((b) => b.branch)).toEqual(["a", "b"]);
    expect(lastBatch([])).toEqual([]);
  });
});
