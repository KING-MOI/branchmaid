import { git } from "./git.js";

export const TAG_PREFIX = "branchmaid/backup";

function stamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
}

export function backupTagName(branch: string, date = new Date()): string {
  return `${TAG_PREFIX}/${stamp(date)}/${branch}`;
}

export function createBackup(branch: string, sha: string, cwd?: string, date = new Date()): string {
  const tag = backupTagName(branch, date);
  git(["tag", tag, sha], cwd);
  return tag;
}
