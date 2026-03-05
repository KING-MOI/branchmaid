import { createColors } from "picocolors";
import { describe, expect, it } from "vitest";
import { table } from "../src/table.js";

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
