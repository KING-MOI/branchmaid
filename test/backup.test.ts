import { describe, expect, it } from "vitest";
import {
  backupTagName,
  createBackup,
  dropBackup,
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
