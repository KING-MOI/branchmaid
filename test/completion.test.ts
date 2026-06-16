import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { completionScript } from "../src/commands/completion.js";
import { run } from "./cli.js";

describe("completionScript", () => {
  it("lists commands and options for bash", () => {
    expect(completionScript("bash", ["list", "sweep"], ["json"])).toBe(
      'complete -W "list sweep --json" branchmaid',
    );
  });

  it("emits fish completions per option", () => {
    const out = completionScript("fish", ["list"], ["json", "yes"]);
    expect(out).toContain("complete -c branchmaid -l json");
    expect(out).toContain("complete -c branchmaid -l yes");
  });

  it("rejects unknown shells", () => {
    expect(() => completionScript("tcsh", [], [])).toThrow(/unsupported shell/);
  });
});

describe("completion command", () => {
  it("works outside a git repository", async () => {
    const { code, out } = await run(["completion", "zsh"], tmpdir());
    expect(code).toBe(0);
    expect(out).toContain("#compdef branchmaid");
    expect(out).toContain("sweep");
    expect(out).toContain("--dry-run");
  });
});
