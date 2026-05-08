import { mkdirSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertGitVersion, git, GitError, parseGitVersion, repoRoot } from "../src/git.js";
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

describe("git version", () => {
  it("parses version strings", () => {
    expect(parseGitVersion("git version 2.54.0 (Apple Git-157)")).toEqual([2, 54]);
    expect(parseGitVersion("git version 2.43.0.windows.1")).toEqual([2, 43]);
    expect(parseGitVersion("nonsense")).toBeUndefined();
  });

  it("rejects old git", () => {
    expect(() => assertGitVersion("git version 2.30.1")).toThrow(/2\.41 or newer/);
    expect(() => assertGitVersion("git version 1.9.0")).toThrow(/found 1\.9/);
  });

  it("accepts new or unknown versions", () => {
    expect(() => assertGitVersion("git version 2.41.0")).not.toThrow();
    expect(() => assertGitVersion("git version 3.0.0")).not.toThrow();
    expect(() => assertGitVersion("weird build")).not.toThrow();
  });
});
