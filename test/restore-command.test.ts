import { describe, expect, it } from "vitest";
import { listBranches } from "../src/branches.js";
import { run } from "./cli.js";
import { makeRepo, sh } from "./helpers.js";

function swept(): string {
  const r = makeRepo();
  sh(r, ["branch", "feature/done"]);
  return r;
}

describe("backups and restore", () => {
  it("lists backups after a sweep", async () => {
    const r = swept();
    await run(["sweep", "-y"], r);
    const { out } = await run(["backups"], r);
    expect(out).toContain("feature/done");
    expect(out).toContain("branchmaid/backup/");
  });

  it("says when there are no backups", async () => {
    expect((await run(["backups"], makeRepo())).out).toContain("no backups");
  });

  it("restores a swept branch", async () => {
    const r = swept();
    const sha = sh(r, ["rev-parse", "feature/done"]);
    await run(["sweep", "-y"], r);
    const { code, out } = await run(["restore", "feature/done"], r);
    expect(code).toBe(0);
    expect(out).toContain("restored feature/done");
    expect(listBranches(r).find((b) => b.name === "feature/done")?.sha).toBe(sha);
  });

  it("errors on missing name or unknown backup", async () => {
    const r = makeRepo();
    expect((await run(["restore"], r)).err).toContain("usage");
    expect((await run(["restore", "nope"], r)).err).toContain("no backup found for nope");
  });
});

describe("backup commands without a base branch", () => {
  it("work in repos with no main or master", async () => {
    const r = makeRepo();
    sh(r, ["branch", "-m", "main", "trunk"]);
    const { code, out } = await run(["backups"], r);
    expect(code).toBe(0);
    expect(out).toContain("no backups");
  });
});

describe("backups --prune", () => {
  function withBackups(): string {
    const r = makeRepo();
    sh(r, ["tag", "branchmaid/backup/20200101T000000Z/ancient"]);
    sh(r, [
      "tag",
      `branchmaid/backup/${new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d+Z$/, "Z")}/recent`,
    ]);
    return r;
  }

  it("drops backups older than the cutoff", async () => {
    const r = withBackups();
    const { out } = await run(["backups", "--prune", "30d"], r);
    expect(out).toContain("1 backup(s) removed");
    const left = (await run(["backups"], r)).out;
    expect(left).toContain("recent");
    expect(left).not.toContain("ancient");
  });

  it("respects --dry-run", async () => {
    const r = withBackups();
    expect((await run(["backups", "--prune", "30d", "-n"], r)).out).toContain("would drop");
    expect((await run(["backups"], r)).out).toContain("ancient");
  });
});

describe("restore --as", () => {
  it("restores under a different name", async () => {
    const r = swept();
    await run(["sweep", "-y"], r);
    const { out } = await run(["restore", "feature/done", "--as", "feature/again"], r);
    expect(out).toContain("restored feature/again");
    expect(listBranches(r).map((b) => b.name)).toContain("feature/again");
  });
});
