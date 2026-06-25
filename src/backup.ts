import { git } from "./git.js";

export const TAG_PREFIX = "branchmaid/backup";

function stamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z");
}

export function backupTagName(branch: string, date = new Date(), n = 1): string {
  return `${TAG_PREFIX}/${stamp(date)}${n > 1 ? `.${n}` : ""}/${branch}`;
}

export function createBackup(branch: string, sha: string, cwd?: string, date = new Date()): string {
  for (let n = 1; ; n++) {
    const tag = backupTagName(branch, date, n);
    try {
      git(["rev-parse", "--verify", "--quiet", `refs/tags/${tag}`], cwd);
    } catch {
      git(["tag", tag, sha], cwd);
      return tag;
    }
  }
}

export interface Backup {
  tag: string;
  branch: string;
  date: Date;
  sha: string;
}

function parseStamp(s: string): Date {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z(?:\.\d+)?$/.exec(s);
  if (!m) return new Date(NaN);
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
}

export function parseBackupTag(tag: string): { branch: string; date: Date } | undefined {
  if (!tag.startsWith(`${TAG_PREFIX}/`)) return undefined;
  const rest = tag.slice(TAG_PREFIX.length + 1);
  const slash = rest.indexOf("/");
  if (slash < 0) return undefined;
  const date = parseStamp(rest.slice(0, slash));
  if (Number.isNaN(date.getTime())) return undefined;
  return { branch: rest.slice(slash + 1), date };
}

export function listBackups(cwd?: string): Backup[] {
  const out = git(
    ["for-each-ref", "--format=%(refname:short)%00%(objectname)", `refs/tags/${TAG_PREFIX}`],
    cwd,
  );
  if (!out) return [];
  const backups: Backup[] = [];
  for (const line of out.split("\n")) {
    const [tag, sha] = line.split("\0");
    const parsed = parseBackupTag(tag);
    if (parsed) backups.push({ tag, sha, ...parsed });
  }
  return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function restoreBackup(backup: Backup, cwd?: string, as = backup.branch): void {
  git(["branch", as, backup.sha], cwd);
}

export function dropBackup(backup: Backup, cwd?: string): void {
  git(["tag", "-d", backup.tag], cwd);
}

export function backupsOlderThan(all: Backup[], ms: number, now = Date.now()): Backup[] {
  return all.filter((b) => now - b.date.getTime() >= ms);
}

export function lastBatch(all: Backup[]): Backup[] {
  if (all.length === 0) return [];
  const newest = Math.max(...all.map((b) => b.date.getTime()));
  return all.filter((b) => b.date.getTime() === newest);
}
