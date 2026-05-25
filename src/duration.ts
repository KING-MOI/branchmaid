const DAY = 24 * 60 * 60 * 1000;

const UNITS: Record<string, number> = {
  h: DAY / 24,
  d: DAY,
  w: 7 * DAY,
  mo: 30 * DAY,
  y: 365 * DAY,
};

export function parseDuration(input: string): number {
  const m = /^(\d+)([a-z]+)$/.exec(input.trim().toLowerCase());
  if (!m || !(m[2] in UNITS)) {
    throw new Error(`invalid duration: ${input}`);
  }
  return Number(m[1]) * UNITS[m[2]];
}

export function formatAge(ms: number): string {
  const days = Math.floor(ms / DAY);
  if (days < 1) return "today";
  if (days < 14) return `${days}d`;
  if (days < 60) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

export function parseCutoff(input: string, now = Date.now()): number {
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
    const at = Date.parse(input);
    if (Number.isNaN(at)) throw new Error(`invalid date: ${input}`);
    if (at > now) throw new Error(`date is in the future: ${input}`);
    return now - at;
  }
  return parseDuration(input);
}
