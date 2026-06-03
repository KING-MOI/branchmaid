import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { listBackups } from "../src/backup.js";
import { listBranches } from "../src/branches.js";
import { run } from "./cli.js";
import { addRemote, commit, makeRepo, sh } from "./helpers.js";

function repo(): string {
  const r = makeRepo();
  sh(r, ["branch", "merged-one"]);
  sh(r, ["checkout", "-q", "-b", "wip"]);
  commit(r, "wip");
  sh(r, ["checkout", "-q", "main"]);
  commit(r, "main moves on");
  return r;
}

const names = (r: string) =>
  listBranches(r)
    .map((b) => b.name)
    .sort();

describe("sweep", () => {
  it("dry run lists targets without deleting", async () => {
    const r = repo();
    const { code, out } = await run(["sweep", "--dry-run"], r);
    expect(code).toBe(0);
    expect(out).toContain("merged-one");
    expect(out).toContain("would be deleted");
    expect(names(r)).toEqual(["main", "merged-one", "wip"]);
  });

  it("refuses without --yes", async () => {
    const r = repo();
    const { code, err } = await run(["sweep"], r);
    expect(code).toBe(1);
    expect(err).toContain("--yes");
    expect(names(r)).toContain("merged-one");
  });

  it("deletes merged branches and keeps backups", async () => {
    const r = repo();
    const { code, out } = await run(["sweep", "--yes"], r);
    expect(code).toBe(0);
    expect(out).toMatch(/deleted merged-one/);
    expect(names(r)).toEqual(["main", "wip"]);
    expect(listBackups(r).map((b) => b.branch)).toEqual(["merged-one"]);
  });

  it("says so when there is nothing to do", async () => {
    expect((await run(["sweep", "-y"], makeRepo())).out).toContain("nothing to sweep");
  });
});

describe("sweep --no-backup", () => {
  it("deletes without creating tags", async () => {
    const r = repo();
    await run(["sweep", "--yes", "--no-backup"], r);
    expect(names(r)).toEqual(["main", "wip"]);
    expect(listBackups(r)).toEqual([]);
  });
});

describe("sweep --mine", () => {
  it("leaves other people's merged branches alone", async () => {
    const r = makeRepo();
    sh(r, ["checkout", "-q", "-b", "theirs"]);
    sh(r, ["-c", "user.email=other@example.com", "commit", "-q", "--allow-empty", "-m", "t"]);
    sh(r, ["checkout", "-q", "main"]);
    sh(r, ["merge", "-q", "--ff-only", "theirs"]);
    sh(r, ["branch", "ours", "HEAD~1"]);
    await run(["sweep", "-y", "--mine"], r);
    expect(names(r)).toEqual(["main", "theirs"]);
  });
});

describe("sweep kind flags", () => {
  function mixed(): string {
    const r = repo();
    sh(r, ["checkout", "-q", "-b", "ancient"]);
    commit(r, "old", new Date("2020-01-01T00:00:00Z"));
    sh(r, ["checkout", "-q", "main"]);
    return r;
  }

  it("--stale sweeps only stale branches", async () => {
    const r = mixed();
    await run(["sweep", "-y", "--stale"], r);
    expect(names(r)).toEqual(["main", "merged-one", "wip"]);
  });

  it("--merged ignores stale even if config enables it", async () => {
    const r = mixed();
    writeFileSync(join(r, ".branchmaidrc"), JSON.stringify({ sweep: { stale: true } }));
    await run(["sweep", "-y", "--merged"], r);
    expect(names(r)).toEqual(["ancient", "main", "wip"]);
  });
});

describe("sweep --remote", () => {
  function pushed(): { r: string; remote: string } {
    const r = makeRepo();
    const remote = addRemote(r);
    sh(r, ["checkout", "-q", "-b", "done"]);
    commit(r, "done");
    sh(r, ["push", "-q", "-u", "origin", "done"]);
    sh(r, ["checkout", "-q", "main"]);
    sh(r, ["merge", "-q", "--ff-only", "done"]);
    commit(r, "main moves on");
    return { r, remote };
  }

  const remoteHas = (remote: string, name: string) =>
    sh(remote, ["branch", "--list", name, "--format=%(refname:short)"]) === name;

  it("deletes the upstream too", async () => {
    const { r, remote } = pushed();
    const { out } = await run(["sweep", "-y", "--remote"], r);
    expect(out).toContain("deleted origin/done");
    expect(remoteHas(remote, "done")).toBe(false);
  });

  it("leaves the remote alone by default", async () => {
    const { r, remote } = pushed();
    await run(["sweep", "-y"], r);
    expect(remoteHas(remote, "done")).toBe(true);
  });
});

describe("sweep fresh branches", () => {
  it("keeps a branch that was just created at the base tip", async () => {
    const r = makeRepo();
    sh(r, ["branch", "just-started"]);
    await run(["sweep", "-y"], r);
    expect(names(r)).toContain("just-started");
  });

  it("sweeps it once base has moved past it", async () => {
    const r = makeRepo();
    sh(r, ["branch", "ff-merged"]);
    commit(r, "next");
    await run(["sweep", "-y"], r);
    expect(names(r)).not.toContain("ff-merged");
  });
});

describe("sweep --protect", () => {
  it("keeps branches matching the extra patterns", async () => {
    const r = repo();
    await run(["sweep", "-y", "--protect", "merged-*"], r);
    expect(names(r)).toContain("merged-one");
  });
});

describe("sweep --json", () => {
  it("prints planned targets on dry run", async () => {
    const { out } = await run(["sweep", "-n", "--json"], repo());
    expect(JSON.parse(out).map((e: { branch: { name: string } }) => e.branch.name)).toEqual(["merged-one"]);
  });

  it("prints deletion results", async () => {
    const r = repo();
    const { out } = await run(["sweep", "-y", "--json"], r);
    const [res] = JSON.parse(out);
    expect(res).toMatchObject({ name: "merged-one", deleted: true });
    expect(res.tag).toMatch(/^branchmaid\/backup\//);
  });

  it("prints an empty array when there is nothing to do", async () => {
    expect((await run(["sweep", "-y", "--json"], makeRepo())).out).toBe("[]");
  });
});
