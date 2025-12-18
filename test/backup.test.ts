import { describe, expect, it } from "vitest";
import { backupTagName, createBackup } from "../src/backup.js";
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
