const DAY = 24 * 60 * 60 * 1000;

const UNITS: Record<string, number> = {
  d: DAY,
  w: 7 * DAY,
};

export function parseDuration(input: string): number {
  const m = /^(\d+)([a-z]+)$/.exec(input.trim().toLowerCase());
  if (!m || !(m[2] in UNITS)) {
    throw new Error(`invalid duration: ${input}`);
  }
  return Number(m[1]) * UNITS[m[2]];
}
