import { describe, expect, it } from "vitest";
import { globToRegExp, matchesAny } from "../src/glob.js";

describe("globToRegExp", () => {
  it.each([
    ["main", "main", true],
    ["main", "mainline", false],
    ["release/*", "release/1.0", true],
    ["release/*", "release/1.0/hotfix", false],
    ["release/**", "release/1.0/hotfix", true],
    ["feat-?", "feat-a", true],
    ["feat-?", "feat-ab", false],
    ["v1.0", "v1x0", false],
  ])("%s vs %s -> %s", (glob, name, ok) => {
    expect(globToRegExp(glob).test(name)).toBe(ok);
  });
});

describe("matchesAny", () => {
  it("matches when any pattern hits", () => {
    expect(matchesAny("release/2", ["main", "release/*"])).toBe(true);
    expect(matchesAny("feature/x", ["main", "release/*"])).toBe(false);
  });
});
