import { git } from "./git.js";

export interface Branch {
  name: string;
  sha: string;
  date: Date;
  author: string;
  email: string;
  subject: string;
  current: boolean;
  upstream: string;
  gone: boolean;
  worktree: string;
  remote: string;
  remoteRef: string;
}

const FIELDS = [
  "%(refname:short)",
  "%(objectname)",
  "%(committerdate:unix)",
  "%(authorname)",
  "%(authoremail:trim)",
  "%(contents:subject)",
  "%(HEAD)",
  "%(upstream:short)",
  "%(upstream:track)",
  "%(worktreepath)",
  "%(upstream:remotename)",
  "%(upstream:remoteref)",
];

function readRefs(pattern: string, cwd?: string): Branch[] {
  const out = git(["for-each-ref", `--format=${FIELDS.join("%00")}`, pattern], cwd);
  if (!out) return [];
  return out.split("\n").map((line) => {
    const [name, sha, ts, author, email, subject, head, upstream, track, worktree, remote, remoteRef] =
      line.split("\0");
    return {
      name,
      sha,
      date: new Date(Number(ts) * 1000),
      author,
      email,
      subject,
      current: head === "*",
      upstream,
      gone: track === "[gone]",
      worktree,
      remote,
      remoteRef,
    };
  });
}

export function listBranches(cwd?: string): Branch[] {
  return readRefs("refs/heads", cwd);
}

export function listRemoteBranches(remote: string, cwd?: string): Branch[] {
  const prefix = `${remote}/`;
  return readRefs(`refs/remotes/${remote}`, cwd)
    .filter((b) => b.name.startsWith(prefix) && b.name !== `${prefix}HEAD`)
    .map((b) => ({ ...b, remote, remoteRef: `refs/heads/${b.name.slice(prefix.length)}` }));
}
