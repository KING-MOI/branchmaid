import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run } from "./cli.js";
import { addRemote, commit, makeRepo, sh } from "./helpers.js";

describe("main list", () => {
  it("lists branches by default", async () => {
    const repo = makeRepo();
    sh(repo, ["branch", "feature/a"]);
    const { code, out } = await run([], repo);
    expect(code).toBe(0);
    expect(out).toContain("feature/a");
    expect(out).toContain("protected");
  });

  it("rejects unknown commands", async () => {
    const { code, err } = await run(["wat"], makeRepo());
    expect(code).toBe(1);
    expect(err).toContain("unknown command: wat");
  });
});

describe("main errors", () => {
  it("reports unknown options", async () => {
    const { code, err } = await run(["--nope"], makeRepo());
    expect(code).toBe(1);
    expect(err).toMatch(/error.*--nope/);
  });

  it("reports when not in a git repo", async () => {
    const { code, err } = await run([], tmpdir());
    expect(code).toBe(1);
    expect(err).toMatch(/not a git repository/);
  });
});

describe("main config", () => {
  it("reads .branchmaidrc from the repo root when run in a subdirectory", async () => {
    const repo = makeRepo();
    writeFileSync(join(repo, ".branchmaidrc"), JSON.stringify({ protected: ["keep/*"] }));
    mkdirSync(join(repo, "sub"));
    sh(repo, ["branch", "keep/me"]);
    const { out } = await run([], join(repo, "sub"));
    expect(out).toMatch(/keep\/me.*protected/);
  });
});

describe("main list ordering", () => {
  it("puts the oldest branch first", async () => {
    const repo = makeRepo();
    sh(repo, ["checkout", "-q", "-b", "ancient"]);
    commit(repo, "a", new Date("2020-01-01T00:00:00Z"));
    sh(repo, ["checkout", "-q", "main"]);
    const lines = (await run([], repo)).out.split("\n");
    expect(lines[0]).toContain("ancient");
  });
});

describe("main list --json", () => {
  it("prints machine readable entries", async () => {
    const repo = makeRepo();
    sh(repo, ["branch", "feature/a"]);
    const { out } = await run(["--json"], repo);
    const parsed = JSON.parse(out);
    expect(parsed.map((e: { branch: { name: string } }) => e.branch.name).sort()).toEqual([
      "feature/a",
      "main",
    ]);
    expect(parsed[0]).toHaveProperty("reasons");
  });
});

describe("main list filters", () => {
  function repoWithKinds(): string {
    const repo = makeRepo();
    sh(repo, ["branch", "merged-one"]);
    sh(repo, ["checkout", "-q", "-b", "old-one"]);
    commit(repo, "old", new Date("2020-01-01T00:00:00Z"));
    sh(repo, ["checkout", "-q", "-b", "fresh-one", "main"]);
    commit(repo, "fresh");
    sh(repo, ["checkout", "-q", "main"]);
    return repo;
  }

  it("--merged shows only merged, unprotected branches", async () => {
    const { out } = await run(["--merged"], repoWithKinds());
    expect(out).toContain("merged-one");
    expect(out).not.toContain("old-one");
    expect(out).not.toContain("main");
  });

  it("--stale shows only old branches", async () => {
    const { out } = await run(["--stale"], repoWithKinds());
    expect(out).toContain("old-one");
    expect(out).not.toContain("fresh-one");
  });

  it("filters combine as a union", async () => {
    const { out } = await run(["--stale", "--merged"], repoWithKinds());
    expect(out).toContain("old-one");
    expect(out).toContain("merged-one");
    expect(out).not.toContain("fresh-one");
  });
});

describe("main list --squash", () => {
  it("treats squash-merged branches as merged", async () => {
    const repo = makeRepo();
    sh(repo, ["checkout", "-q", "-b", "squashy"]);
    writeFileSync(join(repo, "f.txt"), "f\n");
    sh(repo, ["add", "f.txt"]);
    commit(repo, "f");
    sh(repo, ["checkout", "-q", "main"]);
    sh(repo, ["merge", "-q", "--squash", "squashy"]);
    commit(repo, "squash");

    expect((await run(["--merged"], repo)).out).not.toContain("squashy");
    expect((await run(["--merged", "--squash"], repo)).out).toContain("squashy");
  });
});

describe("main help and version", () => {
  it("prints help with -h and help", async () => {
    for (const argv of [["-h"], ["--help"], ["help"]]) {
      const { code, out } = await run(argv, tmpdir());
      expect(code).toBe(0);
      expect(out).toContain("Usage");
    }
  });

  it("prints the package version", async () => {
    const { out } = await run(["-v"], tmpdir());
    expect(out).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe("main --base", () => {
  it("explains when the base branch does not exist", async () => {
    const { code, err } = await run(["--base", "nope"], makeRepo());
    expect(code).toBe(1);
    expect(err).toContain("base branch not found: nope");
  });
});

describe("main --mine", () => {
  it("only shows branches authored by the configured user", async () => {
    const repo = makeRepo();
    sh(repo, ["checkout", "-q", "-b", "theirs"]);
    sh(repo, ["-c", "user.email=other@example.com", "commit", "-q", "--allow-empty", "-m", "theirs"]);
    sh(repo, ["checkout", "-q", "-b", "ours", "main"]);
    commit(repo, "ours");
    sh(repo, ["checkout", "-q", "main"]);
    const { out } = await run(["--mine"], repo);
    expect(out).toContain("ours");
    expect(out).not.toContain("theirs");
  });
});

describe("main --names", () => {
  it("prints bare branch names", async () => {
    const repo = makeRepo();
    sh(repo, ["branch", "merged-one"]);
    expect((await run(["--merged", "--names"], repo)).out).toBe("merged-one");
  });
});

describe("main --sort", () => {
  it("sorts by name", async () => {
    const repo = makeRepo();
    sh(repo, ["branch", "b"]);
    sh(repo, ["branch", "a"]);
    expect((await run(["--sort", "name", "--names"], repo)).out).toBe("a\nb\nmain");
  });

  it("rejects unknown keys", async () => {
    expect((await run(["--sort", "size"], makeRepo())).err).toContain("unknown sort key: size");
  });
});

describe("main --limit", () => {
  it("caps the number of rows", async () => {
    const repo = makeRepo();
    sh(repo, ["branch", "a"]);
    sh(repo, ["branch", "b"]);
    expect((await run(["--sort", "name", "--names", "--limit", "2"], repo)).out).toBe("a\nb");
  });
});

describe("main --limit validation", () => {
  it("rejects non-positive or non-numeric limits", async () => {
    for (const bad of ["abc", "0", "-1", "1.5"]) {
      const { code, err } = await run([`--limit=${bad}`], makeRepo());
      expect(code).toBe(1);
      expect(err).toContain("--limit must be a positive integer");
    }
  });
});

describe("main --fetch", () => {
  it("notices upstreams deleted on the remote", async () => {
    const repo = makeRepo();
    const remote = addRemote(repo);
    sh(repo, ["checkout", "-q", "-b", "shipped"]);
    commit(repo, "ship");
    sh(repo, ["push", "-q", "-u", "origin", "shipped"]);
    sh(repo, ["checkout", "-q", "main"]);
    sh(remote, ["branch", "-D", "shipped"]);

    expect((await run(["--gone", "--names"], repo)).out).toBe("");
    expect((await run(["--gone", "--names", "--fetch"], repo)).out).toBe("shipped");
  });
});

describe("main empty results", () => {
  it("says nothing matched instead of printing a blank table", async () => {
    expect((await run(["--gone"], makeRepo())).out).toBe("no branches match");
  });
});

describe("main --no-color", () => {
  it("is accepted", async () => {
    expect((await run(["--no-color"], makeRepo())).code).toBe(0);
  });
});

describe("main --author", () => {
  it("matches name or email case-insensitively", async () => {
    const repo = makeRepo();
    sh(repo, ["checkout", "-q", "-b", "alice-work"]);
    sh(repo, [
      "-c",
      "user.name=Alice",
      "-c",
      "user.email=alice@x.dev",
      "commit",
      "-q",
      "--allow-empty",
      "-m",
      "a",
    ]);
    sh(repo, ["checkout", "-q", "main"]);
    expect((await run(["--author", "ALICE", "--names"], repo)).out).toBe("alice-work");
    expect((await run(["--author", "x.dev", "--names"], repo)).out).toBe("alice-work");
  });
});

describe("main empty repository", () => {
  it("explains that there are no commits yet", async () => {
    const dir = mkdtempSync(join(tmpdir(), "branchmaid-empty-"));
    sh(dir, ["init", "-q", "-b", "main"]);
    const { code, err } = await run([], dir);
    expect(code).toBe(1);
    expect(err).toContain("no commits yet");
  });
});
