import { describe, expect, it } from "vitest";
import type { Reason } from "../src/classify.js";
import { summarize } from "../src/render.js";
import type { Entry } from "../src/scan.js";
import { branch } from "./fixtures.js";

const entry = (name: string, reasons: Reason[], isProtected = false): Entry => ({
  branch: branch(name),
  reasons,
  protected: isProtected,
  age: 0,
  ahead: 0,
  behind: 0,
});

describe("summarize", () => {
  it("counts reasons on unprotected branches", () => {
    expect(
      summarize([
        entry("main", ["merged"], true),
        entry("a", ["merged", "stale"]),
        entry("b", ["gone"]),
        entry("c", []),
      ]),
    ).toBe("4 branches · 1 merged · 1 gone · 1 stale");
  });

  it("uses singular for one branch", () => {
    expect(summarize([entry("main", [], true)])).toBe("1 branch");
  });
});
