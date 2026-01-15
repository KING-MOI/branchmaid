import { mkdirSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { git, GitError, repoRoot } from "../src/git.js";
import { makeRepo } from "./helpers.js";

describe("git", () => {
  it("returns trimmed stdout", () => {
    const repo = makeRepo();
    expect(git(["rev-parse", "--abbrev-ref", "HEAD"], repo)).toBe("main");
  });

  it("throws GitError with stderr message", () => {
    const repo = makeRepo();
    expect(() => git(["rev-parse", "nope"], repo)).toThrow(GitError);
  });
});

describe("repoRoot", () => {
  it("resolves the top level from a subdirectory", () => {
    const repo = makeRepo();
    mkdirSync(join(repo, "a", "b"), { recursive: true });
    expect(realpathSync(repoRoot(join(repo, "a", "b")))).toBe(realpathSync(repo));
  });
});
