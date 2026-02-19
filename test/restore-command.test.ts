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
