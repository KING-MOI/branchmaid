import { describe, expect, it } from "vitest";
import { git, GitError } from "../src/git.js";
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
