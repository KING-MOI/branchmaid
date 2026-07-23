import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scan } from "../src/scan.js";
import { addRemote, commit, makeRepo, sh } from "./helpers.js";

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

describe("scan ahead/behind", () => {
  it("fills in counts per branch", () => {
    const repo = setup();
    const ancient = scan({ base: "main", staleAfter: DAY, protected: [] }, repo).find(
      (e) => e.branch.name === "ancient",
    );
    expect(ancient).toMatchObject({ ahead: 1, behind: 0 });
  });
});

describe("scan orphan branches", () => {
  it("survives --squash on unrelated history", () => {
    const repo = makeRepo();
    sh(repo, ["checkout", "-q", "--orphan", "gh-pages"]);
    commit(repo, "pages");
    sh(repo, ["checkout", "-q", "main"]);
    const entries = scan({ base: "main", staleAfter: DAY, protected: ["main"], squash: true }, repo);
    expect(entries.find((e) => e.branch.name === "gh-pages")?.reasons).toEqual([]);
  });
});

describe("scan remote", () => {
  it("classifies branches on a remote and protects base by short name", () => {
    const repo = makeRepo();
    addRemote(repo);
    sh(repo, ["push", "-q", "origin", "main:done"]);
    commit(repo, "main moves on");
    sh(repo, ["push", "-q", "origin", "main", "main:release/1"]);
    sh(repo, ["fetch", "-q"]);
    const entries = scan(
      { base: "main", staleAfter: DAY, protected: ["main", "release/*"], remote: "origin" },
      repo,
    );
    const byName = Object.fromEntries(entries.map((e) => [e.branch.name, e]));
    expect(byName["origin/done"].reasons).toEqual(["merged"]);
    expect(byName["origin/done"].protected).toBe(false);
    expect(byName["origin/main"].protected).toBe(true);
    expect(byName["origin/release/1"].protected).toBe(true);
  });
});
