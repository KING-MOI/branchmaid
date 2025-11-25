import { describe, expect, it } from "vitest";
import { formatAge, parseDuration } from "../src/duration.js";

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
