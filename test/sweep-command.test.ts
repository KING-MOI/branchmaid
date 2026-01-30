import { afterEach, describe, expect, it, vi } from "vitest";
import { listBackups } from "../src/backup.js";
import { listBranches } from "../src/branches.js";
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

function repo(): string {
  const r = makeRepo();
  sh(r, ["branch", "merged-one"]);
  sh(r, ["checkout", "-q", "-b", "wip"]);
  commit(r, "wip");
  sh(r, ["checkout", "-q", "main"]);
  return r;
}

const names = (r: string) => listBranches(r).map((b) => b.name).sort();

describe("sweep", () => {
  it("dry run lists targets without deleting", () => {
    const r = repo();
    const { code, out } = run(["sweep", "--dry-run"], r);
    expect(code).toBe(0);
    expect(out).toContain("merged-one");
    expect(out).toContain("would be deleted");
    expect(names(r)).toEqual(["main", "merged-one", "wip"]);
  });

  it("refuses without --yes", () => {
    const r = repo();
    const { code, err } = run(["sweep"], r);
    expect(code).toBe(1);
    expect(err).toContain("--yes");
    expect(names(r)).toContain("merged-one");
  });

  it("deletes merged branches and keeps backups", () => {
    const r = repo();
    const { code, out } = run(["sweep", "--yes"], r);
    expect(code).toBe(0);
    expect(out).toMatch(/deleted merged-one/);
    expect(names(r)).toEqual(["main", "wip"]);
    expect(listBackups(r).map((b) => b.branch)).toEqual(["merged-one"]);
  });

  it("says so when there is nothing to do", () => {
    expect(run(["sweep", "-y"], makeRepo()).out).toContain("nothing to sweep");
  });
});
