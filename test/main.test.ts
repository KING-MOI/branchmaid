import { afterEach, describe, expect, it, vi } from "vitest";
import { main } from "../src/main.js";
import { commit, makeRepo, sh } from "./helpers.js";

function run(argv: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  vi.spyOn(console, "log").mockImplementation((...a) => void out.push(a.join(" ")));
  vi.spyOn(console, "error").mockImplementation((...a) => void err.push(a.join(" ")));
  const code = main(argv, cwd);
  return { code, out: out.join("\n"), err: err.join("\n") };
}

afterEach(() => vi.restoreAllMocks());

describe("main list", () => {
  it("lists branches by default", () => {
    const repo = makeRepo();
    sh(repo, ["branch", "feature/a"]);
    const { code, out } = run([], repo);
    expect(code).toBe(0);
    expect(out).toContain("feature/a");
    expect(out).toContain("protected");
  });

  it("rejects unknown commands", () => {
    const { code, err } = run(["wat"], makeRepo());
    expect(code).toBe(1);
    expect(err).toContain("unknown command: wat");
  });
});
