import { describe, expect, it } from "vitest";
import type { Reason } from "../src/classify.js";
import type { Entry } from "../src/scan.js";
import { selectSweep } from "../src/sweep.js";
import { branch } from "./fixtures.js";

function entry(name: string, reasons: Reason[], isProtected = false): Entry {
  return { branch: branch(name), reasons, protected: isProtected, age: 0, ahead: 0, behind: 0 };
}

const entries = [
  entry("m", ["merged"]),
  entry("s", ["squashed"]),
  entry("g", ["gone"]),
  entry("old", ["stale"]),
  entry("fresh", []),
  entry("main", ["merged"], true),
];

const names = (es: Entry[]) => es.map((e) => e.branch.name);

describe("selectSweep", () => {
  it("defaults to merged and gone", () => {
    expect(names(selectSweep(entries, { olderThan: "30d", merged: true, gone: true, stale: false }))).toEqual(
      ["m", "s", "g"],
    );
  });

  it("can include stale branches", () => {
    expect(
      names(selectSweep(entries, { olderThan: "30d", merged: false, gone: false, stale: true })),
    ).toEqual(["old"]);
  });

  it("never selects protected branches", () => {
    expect(
      names(selectSweep(entries, { olderThan: "30d", merged: true, gone: true, stale: true })),
    ).not.toContain("main");
  });
});
