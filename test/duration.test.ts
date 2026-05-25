import { describe, expect, it } from "vitest";
import { formatAge, parseCutoff, parseDuration } from "../src/duration.js";

const DAY = 86_400_000;

describe("parseDuration", () => {
  it("parses days", () => {
    expect(parseDuration("30d")).toBe(30 * DAY);
  });

  it("parses weeks", () => {
    expect(parseDuration("2w")).toBe(14 * DAY);
  });

  it("rejects garbage", () => {
    expect(() => parseDuration("soon")).toThrow(/invalid duration/);
    expect(() => parseDuration("10x")).toThrow(/invalid duration/);
  });
});

describe("parseDuration units", () => {
  it("parses hours, months and years", () => {
    expect(parseDuration("12h")).toBe(DAY / 2);
    expect(parseDuration("3mo")).toBe(90 * DAY);
    expect(parseDuration("1y")).toBe(365 * DAY);
  });

  it("is case and whitespace tolerant", () => {
    expect(parseDuration(" 4W ")).toBe(28 * DAY);
  });
});

describe("formatAge", () => {
  it.each([
    [0, "today"],
    [3 * DAY, "3d"],
    [20 * DAY, "2w"],
    [95 * DAY, "3mo"],
    [800 * DAY, "2y"],
  ])("formats %d ms as %s", (ms, out) => {
    expect(formatAge(ms)).toBe(out);
  });
});

describe("parseCutoff", () => {
  const now = new Date("2026-03-01T00:00:00Z").getTime();

  it("treats durations as relative to now", () => {
    expect(parseCutoff("2d", now)).toBe(2 * DAY);
  });

  it("accepts an ISO date", () => {
    expect(parseCutoff("2026-02-01", now)).toBe(28 * DAY);
  });

  it("rejects dates in the future", () => {
    expect(() => parseCutoff("2027-01-01", now)).toThrow(/in the future/);
  });
});
