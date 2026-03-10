import { describe, expect, it } from "vitest";
import { classify, isProtected } from "../src/classify.js";
import { branch } from "./fixtures.js";

const DAY = 86_400_000;
const now = new Date("2026-03-01T00:00:00Z").getTime();

describe("classify", () => {
  const ctx = { now, staleAfter: 30 * DAY, merged: new Set(["done"]), squashed: new Set(["squashy"]) };

  it("flags merged branches", () => {
    expect(classify(branch("done", { date: new Date(now) }), ctx)).toEqual(["merged"]);
  });

  it("flags squashed only when not merged", () => {
    expect(classify(branch("squashy", { date: new Date(now) }), ctx)).toEqual(["squashed"]);
  });

  it("flags gone upstreams", () => {
    expect(classify(branch("x", { gone: true, date: new Date(now) }), ctx)).toEqual(["gone"]);
  });

  it("flags stale branches past the threshold", () => {
    expect(classify(branch("x", { date: new Date(now - 31 * DAY) }), ctx)).toEqual(["stale"]);
    expect(classify(branch("x", { date: new Date(now - 29 * DAY) }), ctx)).toEqual([]);
  });

  it("stacks reasons", () => {
    const b = branch("done", { gone: true, date: new Date(now - 60 * DAY) });
    expect(classify(b, ctx)).toEqual(["merged", "gone", "stale"]);
  });
});

describe("isProtected", () => {
  it("protects current, base and pattern matches", () => {
    expect(isProtected(branch("x", { current: true }), [], "main")).toBe(true);
    expect(isProtected(branch("main"), [], "main")).toBe(true);
    expect(isProtected(branch("release/1"), ["release/*"], "main")).toBe(true);
    expect(isProtected(branch("feature/a"), ["release/*"], "main")).toBe(false);
  });
});

describe("isProtected worktrees", () => {
  it("protects branches checked out in another worktree", () => {
    expect(isProtected(branch("x", { worktree: "/tmp/wt" }), [], "main")).toBe(true);
  });
});
