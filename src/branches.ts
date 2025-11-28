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
];

export function listBranches(cwd?: string): Branch[] {
  const out = git(["for-each-ref", `--format=${FIELDS.join("%00")}`, "refs/heads"], cwd);
  if (!out) return [];
  return out.split("\n").map((line) => {
    const [name, sha, ts, author, email, subject, head, upstream, track] = line.split("\0");
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
    };
  });
}
