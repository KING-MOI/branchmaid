import { createColors } from "picocolors";
import { describe, expect, it } from "vitest";
import { table, truncate } from "../src/table.js";

const pc = createColors(true);

describe("table", () => {
  it("pads columns to the widest cell", () => {
    expect(
      table([
        ["a", "bb", "c"],
        ["aaa", "b", "c"],
      ]),
    ).toBe("a    bb  c\naaa  b   c");
  });

  it("ignores ansi codes when measuring", () => {
    const out = table([
      [pc.red("ab"), "x"],
      ["abcd", "y"],
    ]);
    expect(out.split("\n")[0]).toBe(`${pc.red("ab")}    x`);
  });

  it("returns empty string for no rows", () => {
    expect(table([])).toBe("");
  });
});

describe("truncate", () => {
  it("leaves short text alone", () => {
    expect(truncate("abc", 5)).toBe("abc");
  });

  it("cuts long text with an ellipsis", () => {
    expect(truncate("abcdef", 4)).toBe("abc…");
  });

  it("returns nothing when there is no room", () => {
    expect(truncate("abc", 0)).toBe("");
  });
});

describe("table maxWidth", () => {
  it("shortens the final column", () => {
    expect(table([["ab", "a long subject"]], 10)).toBe("ab  a lon…");
  });
});
