import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { main } from "../src/main.js";
import { commit, makeRepo, sh } from "./helpers.js";

function run(argv: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  vi.spyOn(console, "log").mockImplementation((...a) => void out.push(a.join(" ")));
  vi.spyOn(console, "error").mockImplementation((...a) => void err.push(a.join(" ")));
  const code = main(argv, cwd);
  return { code, out: out.join("\n"), err: err.join("\n") };
}

afterEach(() => vi.restoreAllMocks());

describe("main list", () => {
  it("lists branches by default", () => {
    const repo = makeRepo();
    sh(repo, ["branch", "feature/a"]);
    const { code, out } = run([], repo);
    expect(code).toBe(0);
    expect(out).toContain("feature/a");
    expect(out).toContain("protected");
  });

  it("rejects unknown commands", () => {
    const { code, err } = run(["wat"], makeRepo());
    expect(code).toBe(1);
    expect(err).toContain("unknown command: wat");
  });
});

describe("main errors", () => {
  it("reports unknown options", () => {
    const { code, err } = run(["--nope"], makeRepo());
    expect(code).toBe(1);
    expect(err).toMatch(/error.*--nope/);
  });

  it("reports when not in a git repo", () => {
    const { code, err } = run([], tmpdir());
    expect(code).toBe(1);
    expect(err).toMatch(/not a git repository/);
  });
});

describe("main config", () => {
  it("reads .branchmaidrc from the repo root when run in a subdirectory", () => {
    const repo = makeRepo();
    writeFileSync(join(repo, ".branchmaidrc"), JSON.stringify({ protected: ["keep/*"] }));
    mkdirSync(join(repo, "sub"));
    sh(repo, ["branch", "keep/me"]);
    const { out } = run([], join(repo, "sub"));
    expect(out).toMatch(/keep\/me.*protected/);
  });
});

describe("main list ordering", () => {
  it("puts the oldest branch first", () => {
    const repo = makeRepo();
    sh(repo, ["checkout", "-q", "-b", "ancient"]);
    commit(repo, "a", new Date("2020-01-01T00:00:00Z"));
    sh(repo, ["checkout", "-q", "main"]);
    const lines = run([], repo).out.split("\n");
    expect(lines[0]).toContain("ancient");
  });
});

describe("main list --json", () => {
  it("prints machine readable entries", () => {
    const repo = makeRepo();
    sh(repo, ["branch", "feature/a"]);
    const { out } = run(["--json"], repo);
    const parsed = JSON.parse(out);
    expect(parsed.map((e: { branch: { name: string } }) => e.branch.name).sort()).toEqual(["feature/a", "main"]);
    expect(parsed[0]).toHaveProperty("reasons");
  });
});
