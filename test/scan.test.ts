import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scan } from "../src/scan.js";
import { commit, makeRepo, sh } from "./helpers.js";

const DAY = 86_400_000;

function setup(): string {
  const repo = makeRepo();
  sh(repo, ["checkout", "-q", "-b", "merged"]);
  commit(repo, "m");
  sh(repo, ["checkout", "-q", "main"]);
  sh(repo, ["merge", "-q", "--no-ff", "-m", "merge", "merged"]);
  sh(repo, ["checkout", "-q", "-b", "squashy"]);
  writeFileSync(join(repo, "s.txt"), "s\n");
  sh(repo, ["add", "s.txt"]);
  commit(repo, "s");
  sh(repo, ["checkout", "-q", "main"]);
  sh(repo, ["merge", "-q", "--squash", "squashy"]);
  commit(repo, "squash");
  sh(repo, ["checkout", "-q", "-b", "ancient"]);
  commit(repo, "a", new Date(Date.now() - 400 * DAY));
  sh(repo, ["checkout", "-q", "main"]);
  return repo;
}

describe("scan", () => {
  const repo = setup();
  const opts = { base: "main", staleAfter: 30 * DAY, protected: ["main"] };

  it("classifies every branch", () => {
    const byName = Object.fromEntries(scan(opts, repo).map((e) => [e.branch.name, e]));
    expect(byName.merged.reasons).toEqual(["merged"]);
    expect(byName.ancient.reasons).toEqual(["stale"]);
    expect(byName.squashy.reasons).toEqual([]);
    expect(byName.main.protected).toBe(true);
    expect(byName.ancient.age).toBeGreaterThan(399 * DAY);
  });

  it("detects squash merges when asked", () => {
    const squashy = scan({ ...opts, squash: true }, repo).find((e) => e.branch.name === "squashy");
    expect(squashy?.reasons).toEqual(["squashed"]);
  });
});
